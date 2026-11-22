using Mabiz.Application.Contracts;
using Mabiz.Application.Interfaces;
using Mabiz.Application.Services;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Menu;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Mabiz.Infrastructure.Services;

public sealed class SocialSharingService(AppDbContext db, TimeProvider clock, IMenuPrivacyPolicy privacy, SocialService social, IConfiguration configuration)
{
    public async Task<PostShareDto> SharePost(Guid actor, Guid postId, CancellationToken ct)
    {
        var post = await ShareablePost(actor, postId, ct);
        await EnsureAllowed(actor, await PostOwner(post, ct), false, ct);
        var existing = await db.PostShares.AsNoTracking().SingleOrDefaultAsync(x => x.PostId == postId && x.SharedByUserId == actor, ct);
        if (existing is not null) return Map(existing);
        var share = new PostShare { Id = Guid.NewGuid(), PostId = postId, SharedByUserId = actor, CreatedAtUtc = clock.GetUtcNow() };
        db.PostShares.Add(share);
        await db.SaveChangesAsync(ct);
        return Map(share);
    }

    public async Task Unshare(Guid actor, Guid postId, CancellationToken ct)
    {
        var share = await db.PostShares.SingleOrDefaultAsync(x => x.PostId == postId && x.SharedByUserId == actor, ct);
        if (share is null) return;
        db.PostShares.Remove(share);
        await db.SaveChangesAsync(ct);
    }

    public async Task<ShareStateDto> State(Guid actor, Guid postId, CancellationToken ct)
    {
        _ = await social.GetPost(actor, postId, ct);
        var count = await db.PostShares.CountAsync(x => x.PostId == postId && !db.UserBlocks.Any(b => (b.BlockerUserId == actor && b.BlockedUserId == x.SharedByUserId) || (b.BlockerUserId == x.SharedByUserId && b.BlockedUserId == actor)), ct);
        var viewerShared = await db.PostShares.AnyAsync(x => x.PostId == postId && x.SharedByUserId == actor, ct);
        return new ShareStateDto(count, viewerShared);
    }

    public async Task<ShareLinkDto> ExternalLink(Guid actor, Guid postId, CancellationToken ct)
    {
        var post = await ShareablePost(actor, postId, ct);
        if (!post.Discoverable) throw ApiException.Conflict("POST_NOT_SHAREABLE", "This post cannot be shared outside the app.");
        await EnsureAllowed(actor, await PostOwner(post, ct), true, ct);
        var template = configuration["Menu:ExternalShareUrlTemplate"];
        if (string.IsNullOrWhiteSpace(template) || !template.Contains("{postId}", StringComparison.Ordinal))
            throw ApiException.Unavailable("SHARE_LINK_NOT_CONFIGURED", "External share links are not configured.");
        var url = template.Replace("{postId}", postId.ToString("D"), StringComparison.Ordinal);
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw ApiException.Unavailable("SHARE_LINK_NOT_CONFIGURED", "External share links are not configured.");
        return new ShareLinkDto(postId, url);
    }

    private async Task<PostDto> ShareablePost(Guid actor, Guid postId, CancellationToken ct)
    {
        var post = await social.GetPost(actor, postId, ct);
        if (post.Audience != PostAudiences.Public) throw ApiException.Conflict("POST_NOT_SHAREABLE", "Only public posts can be shared.");
        return post;
    }

    private async Task<Guid> PostOwner(PostDto post, CancellationToken ct) =>
        post.BusinessId.HasValue
            ? await db.Businesses.AsNoTracking().Where(x => x.Id == post.BusinessId.Value).Select(x => x.OwnerUserId).SingleAsync(ct)
            : post.AuthorUserId;

    private async Task EnsureAllowed(Guid actor, Guid owner, bool external, CancellationToken ct)
    {
        if (actor == owner) return;
        var settings = await db.Set<MenuSettings>().AsNoTracking().Where(x => x.UserId == owner)
            .Select(x => new { x.SharingPermission, x.AllowPostResharing, x.AllowExternalSharing }).SingleOrDefaultAsync(ct);
        var follower = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actor && x.FollowedUserId == owner, ct);
        var decision = privacy.CanInteract(settings?.SharingPermission ?? "everyone", follower, false);
        if (!decision.Allowed) throw ApiException.Forbidden(decision.Code, "This account does not allow sharing.");
        if (settings is not null && external && !settings.AllowExternalSharing)
            throw ApiException.Forbidden("EXTERNAL_SHARING_DISABLED", "This account does not allow sharing outside the app.");
        if (settings is not null && !external && !settings.AllowPostResharing)
            throw ApiException.Forbidden("RESHARING_DISABLED", "This account does not allow its posts to be reshared.");
    }

    private static PostShareDto Map(PostShare x) => new(x.Id, x.PostId, x.SharedByUserId, x.CreatedAtUtc);
}