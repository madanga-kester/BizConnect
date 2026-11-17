using Mabiz.Application.Configuration;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Catalogue;
using Mabiz.Infrastructure.Persistence;
using Mabiz.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

/// <summary>
/// Accepts image uploads, validates them server-side, and serves bytes back through the API so that
/// publication and membership rules always apply. The storage key never leaves the server.
/// </summary>
public sealed class MediaService(
    AppDbContext db,
    TimeProvider clock,
    IMediaStorageProvider storage,
    StorageOptions options) : IMediaService
{
    public async Task<MediaAssetResponse> UploadAsync(Guid actorId, Guid businessId, MediaUploadRequest request, CancellationToken cancellationToken)
    {
        var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == businessId, cancellationToken)
            ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        await RequireManagerAsync(actorId, businessId, cancellationToken);
        if (business.Status != BusinessStatuses.Active)
            throw ApiException.Unprocessable("BUSINESS_ARCHIVED", "The business is archived.");

        var maximum = options.MaximumUploadBytes;
        if (request.DeclaredSize > maximum)
            throw ApiException.BadRequest("MEDIA_TOO_LARGE",
                $"The upload is larger than the configured maximum of {options.MaximumUploadMebibytes} MiB.");

        var bytes = await ReadCappedAsync(request.Content, maximum, cancellationToken);
        if (bytes.Length == 0) throw ApiException.BadRequest("MEDIA_EMPTY", "The uploaded file is empty.");

        var validated = ImageValidator.Validate(bytes.AsSpan(0, Math.Min(bytes.Length, 32)), bytes.LongLength, maximum)
            ?? throw ApiException.Unprocessable("MEDIA_TYPE_NOT_SUPPORTED",
                $"Only {string.Join(", ", ImageValidator.AllowedContentTypes)} images are accepted. The file signature did not match an allowed image type.");

        var sha256 = ImageValidator.HashHex(bytes);
        var now = clock.GetUtcNow();
        var assetId = Guid.NewGuid();
        var keyPrefix = options.Provider == MediaStorageProviders.S3 ? options.S3.KeyPrefix : "media";
        var storageKey = MediaKeyBuilder.Build(businessId, assetId, sha256, validated.Extension, now, keyPrefix);
        var dimensions = ImageValidator.ReadDimensions(validated.ContentType, bytes.AsSpan(0, Math.Min(bytes.Length, 64)));

        await storage.PutAsync(storageKey, new MemoryStream(bytes, writable: false), validated.ContentType, cancellationToken);
        try
        {
            var asset = new MediaAsset
            {
                Id = assetId, BusinessId = businessId, UploadedByUserId = actorId, Provider = storage.Name,
                StorageKey = storageKey, ContentType = validated.ContentType, SizeBytes = bytes.LongLength, Sha256 = sha256,
                WidthPx = dimensions?.Width, HeightPx = dimensions?.Height, Status = MediaAssetStatuses.Ready,
                CreatedAtUtc = now, Version = Guid.NewGuid()
            };
            db.MediaAssets.Add(asset);
            await db.SaveChangesAsync(cancellationToken);
            return Map(asset);
        }
        catch
        {
            // Never leave a stored object that no row points at.
            try { await storage.DeleteAsync(storageKey, CancellationToken.None); }
            catch { /* the database error is the one worth reporting */ }
            throw;
        }
    }

    public async Task<MediaAssetResponse> GetAsync(Guid actorId, Guid mediaId, CancellationToken cancellationToken)
    {
        var asset = await LoadAssetAsync(mediaId, cancellationToken);
        await EnsureReadableAsync(asset, actorId, cancellationToken);
        return Map(asset);
    }

    public async Task<MediaContentResponse> GetContentAsync(Guid? viewerId, Guid mediaId, CancellationToken cancellationToken)
    {
        var asset = await LoadAssetAsync(mediaId, cancellationToken);
        await EnsureReadableAsync(asset, viewerId, cancellationToken);

        Stream stream;
        try
        {
            stream = await storage.OpenReadAsync(asset.StorageKey, cancellationToken);
        }
        catch (FileNotFoundException)
        {
            throw ApiException.NotFound("MEDIA_CONTENT_MISSING", "The stored object is missing from the configured media storage.");
        }
        catch (IOException ex)
        {
            throw ApiException.Unavailable("MEDIA_STORAGE_UNAVAILABLE",
                $"The configured media storage could not be read ({ex.GetType().Name}). Retry later.");
        }
        return new MediaContentResponse(stream, asset.ContentType, asset.SizeBytes, $"\"{asset.Sha256}\"");
    }

    public async Task DeleteAsync(Guid actorId, Guid mediaId, CancellationToken cancellationToken)
    {
        var asset = await LoadAssetAsync(mediaId, cancellationToken);
        await RequireManagerAsync(actorId, asset.BusinessId, cancellationToken);

        // Attached-media deletion guard: an object in use by a live gallery or a post can never be unlinked
        // underneath its owner, even by the account that uploaded it.
        var usedByCatalogue = await db.CatalogItemMediaLinks.AsNoTracking().AnyAsync(x => x.MediaAssetId == asset.Id, cancellationToken);
        var proxyPath = $"/media/{asset.Id}/content";
        // Both sides are server generated, so a plain ordinal Contains is enough - and it is the only
        // form EF can translate to SQL here.
        var usedByPosts = await db.PostMediaReferences.AsNoTracking()
            .AnyAsync(x => x.Url.Contains(proxyPath), cancellationToken);
        if (usedByCatalogue || usedByPosts)
            throw ApiException.Conflict("MEDIA_IN_USE",
                "This image is attached to a catalogue item or a post. Remove it from those galleries first.");

        await storage.DeleteAsync(asset.StorageKey, cancellationToken);
        // The asset was read with AsNoTracking, so the status change is written as a set-based UPDATE.
        // Attaching a detached entity as Modified would make EF compare the concurrency token against the
        // value it just changed and match zero rows.
        await db.MediaAssets.Where(x => x.Id == asset.Id).ExecuteUpdateAsync(spec => spec
            .SetProperty(x => x.Status, MediaAssetStatuses.Deleted)
            .SetProperty(x => x.DeletedAtUtc, clock.GetUtcNow())
            .SetProperty(x => x.Version, Guid.NewGuid()), cancellationToken);
    }

    private async Task<byte[]> ReadCappedAsync(Stream content, long maximum, CancellationToken cancellationToken)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[81920];
        long total = 0;
        int read;
        while ((read = await content.ReadAsync(chunk.AsMemory(), cancellationToken)) > 0)
        {
            total += read;
            // The declared size is client supplied, so the real cap is enforced while streaming.
            if (total > maximum)
                throw ApiException.BadRequest("MEDIA_TOO_LARGE",
                    $"The upload exceeded the configured maximum of {options.MaximumUploadMebibytes} MiB.");
            buffer.Write(chunk, 0, read);
        }
        return buffer.ToArray();
    }

    private async Task<MediaAsset> LoadAssetAsync(Guid mediaId, CancellationToken cancellationToken)
    {
        var asset = await db.MediaAssets.AsNoTracking().SingleOrDefaultAsync(x => x.Id == mediaId, cancellationToken);
        if (asset is null || asset.Status != MediaAssetStatuses.Ready)
            throw ApiException.NotFound("MEDIA_NOT_FOUND", "The media asset was not found.");
        return asset;
    }

    /// <summary>
    /// Anonymous reads are allowed only for images attached to a published item of a public, active
    /// business. Anything else requires an active membership on the owning business, so a private or
    /// draft image cannot be fetched by guessing an asset id. Existence is not confirmed on denial.
    /// </summary>
    private async Task EnsureReadableAsync(MediaAsset asset, Guid? viewerId, CancellationToken cancellationToken)
    {
        var publiclyAttached = await (
            from link in db.CatalogItemMediaLinks.AsNoTracking()
            join item in db.CatalogItems.AsNoTracking() on link.CatalogItemId equals item.Id
            join business in db.Businesses.AsNoTracking() on item.BusinessId equals business.Id
            where link.MediaAssetId == asset.Id
                  && item.Status == CatalogItemStatuses.Published
                  && business.Status == BusinessStatuses.Active
                  && business.Visibility == BusinessVisibility.Public
            select link.Id).AnyAsync(cancellationToken);
        if (publiclyAttached) return;

        if (viewerId is null)
            throw ApiException.NotFound("MEDIA_NOT_FOUND", "The media asset was not found.");

        var role = await db.BusinessMemberships.AsNoTracking()
            .Where(x => x.BusinessId == asset.BusinessId && x.UserId == viewerId.Value && x.RevokedAtUtc == null)
            .Select(x => x.Role).SingleOrDefaultAsync(cancellationToken);
        if (role is null || !BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile))
            throw ApiException.NotFound("MEDIA_NOT_FOUND", "The media asset was not found.");
    }

    private async Task RequireManagerAsync(Guid actorId, Guid businessId, CancellationToken cancellationToken)
    {
        var role = await db.BusinessMemberships.AsNoTracking()
            .Where(x => x.BusinessId == businessId && x.UserId == actorId && x.RevokedAtUtc == null)
            .Select(x => x.Role).SingleOrDefaultAsync(cancellationToken)
            ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        if (!CatalogPermissions.CanManage(role))
            throw ApiException.Forbidden("CATALOGUE_PERMISSION_DENIED", "Uploading catalogue images requires an Owner, Admin or Editor role.");
    }

    private static MediaAssetResponse Map(MediaAsset asset) => new(
        asset.Id.ToString(), asset.BusinessId.ToString(), asset.Provider, asset.ContentType, asset.SizeBytes,
        asset.Sha256, asset.WidthPx, asset.HeightPx, asset.Status, $"/api/v1/media/{asset.Id}/content", asset.CreatedAtUtc);
}
