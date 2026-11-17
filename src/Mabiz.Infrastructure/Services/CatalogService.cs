using System.Text.Json;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Domain.Businesses;
using Mabiz.Domain.Catalogue;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

/// <summary>
/// Stage 5 catalogue. Every write path re-reads the actor's business role, so a client cannot reach a
/// catalogue through a guessed identifier: non-members get 404, members without the permission get 403.
/// </summary>
public sealed class CatalogService(AppDbContext db, TimeProvider clock, INotificationService notificationWriter) : ICatalogService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly string[] SupportedSorts = ["new", "price_asc", "price_desc", "title"];

    public async Task<CatalogItemPageResponse> ListManagedAsync(Guid actorId, Guid businessId, string? kind, string? status,
        string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ViewPrivateProfile, cancellationToken);
        (page, pageSize) = NormalizePage(page, pageSize);

        var query = db.CatalogItems.AsNoTracking().Where(x => x.BusinessId == businessId);
        if (!string.IsNullOrWhiteSpace(kind))
            query = query.Where(x => x.Kind == kind.Trim().ToLowerInvariant());
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status.Trim().ToLowerInvariant());
        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
            query = query.Where(x => EF.Functions.ILike(x.Title, $"%{term}%")
                                    || EF.Functions.ILike(x.Description, $"%{term}%")
                                    || EF.Functions.ILike(x.Category, $"%{term}%")
                                    || (x.Sku != null && EF.Functions.ILike(x.Sku, $"%{term}%")));

        var total = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(x => x.UpdatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var galleries = await LoadGalleriesAsync(items.Select(x => x.Id), cancellationToken);
        return new CatalogItemPageResponse(items.Select(x => Map(x, business, galleries.GetValueOrDefault(x.Id, []), role)).ToList(), total, page, pageSize);
    }

    public async Task<CatalogItemResponse> CreateAsync(Guid actorId, Guid businessId, string kind, CatalogItemCreateRequest request, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ManageCatalogue, cancellationToken);
        var normalizedKind = kind.Trim().ToLowerInvariant();
        ValidateKind(normalizedKind, request.Sku, request.StockQuantity, request.InStock, request.Unit,
            request.AvailabilityStatus, request.LeadTimeDays, request.DurationMinutes, request.VisitType, request.ServiceAreas);
        ValidatePricing(request.PriceKsh, request.PriceNote, request.PriceNegotiable);
        ValidateCategory(request.Category, request.Subcategory);
        await EnsureSkuAvailableAsync(businessId, NormalizeUppercase(request.Sku), null, cancellationToken);
        var desiredStatus = string.IsNullOrWhiteSpace(request.Status) ? CatalogItemStatuses.Draft : request.Status.Trim().ToLowerInvariant();
        if (desiredStatus == CatalogItemStatuses.Published && !CatalogPermissions.CanPublish(role))
            throw ApiException.Forbidden("CATALOGUE_PUBLISH_DENIED", "Publishing a catalogue item requires an Owner, Admin or Editor role.");

        var now = clock.GetUtcNow();
        var item = new CatalogItem
        {
            Id = Guid.NewGuid(), BusinessId = businessId, CreatedByUserId = actorId,
            Kind = normalizedKind, Title = request.Title.Trim(), Description = request.Description.Trim(),
            Category = request.Category.Trim(), Subcategory = request.Subcategory.Trim(),
            Slug = await UniqueSlugAsync(businessId, request.Title, cancellationToken),
            PriceKsh = request.PriceKsh, PriceNote = (request.PriceNote ?? string.Empty).Trim(), Currency = "KES",
            PriceNegotiable = request.PriceNegotiable,
            Sku = NormalizeUppercase(request.Sku), StockQuantity = request.StockQuantity, InStock = request.InStock, Unit = NormalizeNullable(request.Unit),
            AvailabilityStatus = NormalizeAvailability(normalizedKind, request.AvailabilityStatus),
            LeadTimeDays = request.LeadTimeDays, DurationMinutes = request.DurationMinutes,
            ServiceAreas = NormalizeList(request.ServiceAreas), VisitType = NormalizeNullable(request.VisitType),
            Status = desiredStatus, AttributesJson = SerializeAttributes(request.Attributes),
            CreatedAtUtc = now, UpdatedAtUtc = now,
            PublishedAtUtc = desiredStatus == CatalogItemStatuses.Published ? now : null,
            Version = Guid.NewGuid()
        };

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        db.CatalogItems.Add(item);
        await ReplaceGalleriesAsync(item, request.MediaAssetIds, [], businessId, now, cancellationToken);
        AddActivity(businessId, actorId, "catalogue.item.created", $"Added {item.Kind} '{item.Title}' to the catalogue.", now);
        if (item.Status == CatalogItemStatuses.Published)
            await NotifyPublishedAsync(actorId, business, item, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return Map(item, business, gallery.GetValueOrDefault(item.Id, []), role);
    }

    public async Task<CatalogItemResponse> GetManagedAsync(Guid actorId, Guid businessId, Guid itemId, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ViewPrivateProfile, cancellationToken);
        var item = await GetItemAsync(businessId, itemId, cancellationToken);
        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return Map(item, business, gallery.GetValueOrDefault(item.Id, []), role);
    }

    public async Task<CatalogItemResponse> UpdateAsync(Guid actorId, Guid businessId, Guid itemId, CatalogItemUpdateRequest request, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ManageCatalogue, cancellationToken);
        var item = await GetItemAsync(businessId, itemId, cancellationToken, track: true);
        if (item.Status == CatalogItemStatuses.Archived && request.Status is null)
            throw ApiException.Unprocessable("CATALOGUE_ITEM_ARCHIVED", "Restore the item to draft before editing it.");

        ValidateKind(item.Kind, request.Sku ?? item.Sku, request.StockQuantity ?? item.StockQuantity, request.InStock ?? item.InStock,
            request.Unit ?? item.Unit, request.AvailabilityStatus ?? item.AvailabilityStatus,
            request.LeadTimeDays ?? item.LeadTimeDays, request.DurationMinutes ?? item.DurationMinutes,
            request.VisitType ?? item.VisitType, request.ServiceAreas ?? item.ServiceAreas.ToList());
        var price = request.ClearPrice == true ? null : request.PriceKsh ?? item.PriceKsh;
        ValidatePricing(price, request.PriceNote ?? item.PriceNote, request.PriceNegotiable ?? item.PriceNegotiable);
        if (request.Category is not null || request.Subcategory is not null)
            ValidateCategory(request.Category ?? item.Category, request.Subcategory ?? item.Subcategory);
        if (request.Sku is not null)
            await EnsureSkuAvailableAsync(businessId, NormalizeUppercase(request.Sku), item.Id, cancellationToken);

        if (!string.IsNullOrWhiteSpace(request.Title) && !string.Equals(request.Title.Trim(), item.Title, StringComparison.Ordinal))
        {
            item.Title = request.Title.Trim();
            item.Slug = await UniqueSlugAsync(businessId, item.Title, cancellationToken, item.Id);
        }
        if (request.Description is not null) item.Description = request.Description.Trim();
        if (request.Category is not null) item.Category = request.Category.Trim();
        if (request.Subcategory is not null) item.Subcategory = request.Subcategory.Trim();
        if (request.ClearPrice == true)
        {
            item.PriceKsh = null;
            if (string.IsNullOrWhiteSpace(request.PriceNote) && !(request.PriceNegotiable ?? item.PriceNegotiable))
                throw ApiException.Unprocessable("PRICE_REQUIRED", "An item needs a price, a price note or the negotiable flag.");
        }
        else if (request.PriceKsh is not null) item.PriceKsh = request.PriceKsh;
        if (request.PriceNote is not null) item.PriceNote = request.PriceNote.Trim();
        if (request.PriceNegotiable is not null) item.PriceNegotiable = request.PriceNegotiable.Value;
        if (request.Sku is not null) item.Sku = NormalizeUppercase(request.Sku);
        if (request.StockQuantity is not null) item.StockQuantity = request.StockQuantity;
        if (request.InStock is not null) item.InStock = request.InStock;
        if (request.Unit is not null) item.Unit = NormalizeNullable(request.Unit);
        if (request.AvailabilityStatus is not null) item.AvailabilityStatus = NormalizeAvailability(item.Kind, request.AvailabilityStatus);
        if (request.LeadTimeDays is not null) item.LeadTimeDays = request.LeadTimeDays;
        if (request.DurationMinutes is not null) item.DurationMinutes = request.DurationMinutes;
        if (request.ServiceAreas is not null) item.ServiceAreas = NormalizeList(request.ServiceAreas);
        if (request.VisitType is not null) item.VisitType = NormalizeNullable(request.VisitType);
        if (request.Attributes is not null) item.AttributesJson = SerializeAttributes(request.Attributes);

        var previousStatus = item.Status;
        var now = clock.GetUtcNow();
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var target = request.Status.Trim().ToLowerInvariant();
            await ApplyStatusAsync(item, target, role, now);
        }
        item.UpdatedAtUtc = now;
        item.Version = Guid.NewGuid();

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        if (request.MediaAssetIds is not null)
            await ReplaceGalleriesAsync(item, request.MediaAssetIds, request.AltTexts ?? [], businessId, now, cancellationToken);
        AddActivity(businessId, actorId, "catalogue.item.updated", $"Updated {item.Kind} '{item.Title}'.", now);
        if (previousStatus != CatalogItemStatuses.Published && item.Status == CatalogItemStatuses.Published)
            await NotifyPublishedAsync(actorId, business, item, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return Map(item, business, gallery.GetValueOrDefault(item.Id, []), role);
    }

    public async Task<CatalogItemResponse> SetStatusAsync(Guid actorId, Guid businessId, Guid itemId, string status, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ManageCatalogue, cancellationToken);
        var item = await GetItemAsync(businessId, itemId, cancellationToken, track: true);
        var previousStatus = item.Status;
        var now = clock.GetUtcNow();
        await ApplyStatusAsync(item, status.Trim().ToLowerInvariant(), role, now);
        item.UpdatedAtUtc = now;
        item.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, $"catalogue.item.{status}", $"{char.ToUpperInvariant(status[0])}{status[1..]} catalogue item '{item.Title}'.", now);
        if (previousStatus != CatalogItemStatuses.Published && item.Status == CatalogItemStatuses.Published)
            await NotifyPublishedAsync(actorId, business, item, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return Map(item, business, gallery.GetValueOrDefault(item.Id, []), role);
    }

    public async Task<CatalogItemResponse> ReplaceMediaAsync(Guid actorId, Guid businessId, Guid itemId, CatalogMediaReplaceRequest request, CancellationToken cancellationToken)
    {
        var (role, business) = await RequireMembershipAsync(actorId, businessId, BusinessPermission.ManageCatalogue, cancellationToken);
        var item = await GetItemAsync(businessId, itemId, cancellationToken, track: true);
        var now = clock.GetUtcNow();
        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);
        await ReplaceGalleriesAsync(item, request.MediaAssetIds, request.AltTexts, businessId, now, cancellationToken);
        item.UpdatedAtUtc = now;
        item.Version = Guid.NewGuid();
        AddActivity(businessId, actorId, "catalogue.media.updated", $"Changed the gallery of '{item.Title}' ({request.MediaAssetIds.Count} image(s)).", now);
        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return Map(item, business, gallery.GetValueOrDefault(item.Id, []), role);
    }

    public async Task<CatalogPublicPageResponse> DiscoverAsync(string kind, string? search, string? category, string? county, string? town,
        decimal? minPrice, decimal? maxPrice, string? availability, string sort, int page, int pageSize, CancellationToken cancellationToken)
    {
        if (!CatalogItemKinds.All.Contains(kind))
            throw ApiException.BadRequest("INVALID_CATALOGUE_KIND", "Discovery accepts 'product' or 'service'.");
        (page, pageSize) = NormalizePage(page, pageSize);
        var requestedSort = string.IsNullOrWhiteSpace(sort) ? "new" : sort.Trim().ToLowerInvariant();
        if (!SupportedSorts.Contains(requestedSort))
            throw ApiException.BadRequest("INVALID_SORT", "Sort must be one of new, price_asc, price_desc, title.");

        var query = from item in db.CatalogItems.AsNoTracking()
                    join business in db.Businesses.AsNoTracking() on item.BusinessId equals business.Id
                    where item.Status == CatalogItemStatuses.Published
                          && item.Kind == kind
                          && business.Status == BusinessStatuses.Active
                          && business.Visibility == BusinessVisibility.Public
                    select new { Item = item, Business = business };

        var term = search?.Trim();
        if (!string.IsNullOrEmpty(term))
            query = query.Where(x => EF.Functions.ILike(x.Item.Title, $"%{term}%")
                                     || EF.Functions.ILike(x.Item.Description, $"%{term}%")
                                     || EF.Functions.ILike(x.Item.Category, $"%{term}%")
                                     || EF.Functions.ILike(x.Item.Subcategory, $"%{term}%")
                                     || EF.Functions.ILike(x.Business.Name, $"%{term}%"));
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(x => x.Item.Category == category.Trim());
        if (!string.IsNullOrWhiteSpace(county)) query = query.Where(x => x.Business.County == county.Trim());
        if (!string.IsNullOrWhiteSpace(town)) query = query.Where(x => x.Business.Town == town.Trim());
        if (minPrice.HasValue) query = query.Where(x => x.Item.PriceKsh >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(x => x.Item.PriceKsh <= maxPrice.Value);
        if (!string.IsNullOrWhiteSpace(availability))
        {
            var normalized = availability.Trim().ToLowerInvariant();
            if (!CatalogAvailability.All.Contains(normalized))
                throw ApiException.BadRequest("INVALID_AVAILABILITY", "Availability must be one of available, on_request, fully_booked, seasonal.");
            query = query.Where(x => x.Item.AvailabilityStatus == normalized);
        }

        query = requestedSort switch
        {
            "price_asc" => query.OrderBy(x => x.Item.PriceKsh == null).ThenBy(x => x.Item.PriceKsh).ThenByDescending(x => x.Item.PublishedAtUtc),
            "price_desc" => query.OrderByDescending(x => x.Item.PriceKsh).ThenBy(x => x.Item.PriceKsh == null).ThenByDescending(x => x.Item.PublishedAtUtc),
            "title" => query.OrderBy(x => x.Item.Title).ThenByDescending(x => x.Item.PublishedAtUtc),
            _ => query.OrderByDescending(x => x.Item.PublishedAtUtc).ThenByDescending(x => x.Item.Id)
        };

        var total = await query.CountAsync(cancellationToken);
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var galleries = await LoadGalleriesAsync(rows.Select(x => x.Item.Id), cancellationToken);
        var items = rows.Select(x => MapPublic(x.Item, x.Business, galleries.GetValueOrDefault(x.Item.Id, []))).ToList();
        return new CatalogPublicPageResponse(items, total, page, pageSize);
    }

    public async Task<CatalogPublicItemResponse> GetPublishedAsync(string slugOrId, string kind, CancellationToken cancellationToken)
    {
        if (!CatalogItemKinds.All.Contains(kind))
            throw ApiException.BadRequest("INVALID_CATALOGUE_KIND", "Discovery accepts 'product' or 'service'.");
        var key = slugOrId.Trim();
        CatalogItem? item;
        if (Guid.TryParse(key, out var id))
            item = await db.CatalogItems.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.Kind == kind, cancellationToken);
        else
            item = await db.CatalogItems.AsNoTracking().FirstOrDefaultAsync(x => x.Slug == key && x.Kind == kind, cancellationToken);

        if (item is null || item.Status != CatalogItemStatuses.Published)
            throw ApiException.NotFound("CATALOGUE_ITEM_NOT_FOUND", "The catalogue item was not found.");

        var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == item.BusinessId, cancellationToken)
            ?? throw ApiException.NotFound("CATALOGUE_ITEM_NOT_FOUND", "The catalogue item was not found.");
        if (business.Status != BusinessStatuses.Active || business.Visibility != BusinessVisibility.Public)
            throw ApiException.NotFound("CATALOGUE_ITEM_NOT_FOUND", "The catalogue item was not found.");

        var gallery = await LoadGalleriesAsync([item.Id], cancellationToken);
        return MapPublic(item, business, gallery.GetValueOrDefault(item.Id, []));
    }

    private async Task<(string Role, Business Business)> RequireMembershipAsync(Guid actorId, Guid businessId, BusinessPermission permission, CancellationToken cancellationToken)
    {
        var business = await db.Businesses.AsNoTracking().SingleOrDefaultAsync(x => x.Id == businessId, cancellationToken)
            ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        var role = await db.BusinessMemberships.AsNoTracking()
            .Where(x => x.BusinessId == businessId && x.UserId == actorId && x.RevokedAtUtc == null)
            .Select(x => x.Role).SingleOrDefaultAsync(cancellationToken);
        if (role is null) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
        if (!BusinessAccessControl.Allows(role, permission))
            throw ApiException.Forbidden("BUSINESS_PERMISSION_DENIED", "Your business role does not permit this operation.");
        if (business.Status != BusinessStatuses.Active && permission != BusinessPermission.Archive)
            throw ApiException.Unprocessable("BUSINESS_ARCHIVED", "The business is archived.");
        return (role, business);
    }

    private async Task<CatalogItem> GetItemAsync(Guid businessId, Guid itemId, CancellationToken cancellationToken, bool track = false)
    {
        var query = db.CatalogItems.AsQueryable();
        if (!track) query = query.AsNoTracking();
        return await query.SingleOrDefaultAsync(x => x.Id == itemId && x.BusinessId == businessId, cancellationToken)
            ?? throw ApiException.NotFound("CATALOGUE_ITEM_NOT_FOUND", "The catalogue item was not found.");
    }

    private async Task ApplyStatusAsync(CatalogItem item, string target, string role, DateTimeOffset now)
    {
        if (!CatalogItemStatuses.All.Contains(target))
            throw ApiException.BadRequest("INVALID_CATALOGUE_STATUS", "Status must be draft, published or archived.");
        if (target == item.Status) return;

        switch (target)
        {
            case CatalogItemStatuses.Published:
                if (!CatalogPermissions.CanPublish(role))
                    throw ApiException.Forbidden("CATALOGUE_PUBLISH_DENIED", "Publishing a catalogue item requires an Owner, Admin or Editor role.");
                if (string.IsNullOrWhiteSpace(item.Description))
                    throw ApiException.Unprocessable("CATALOGUE_INCOMPLETE", "Add a description before publishing.");
                item.PublishedAtUtc = now;
                item.ArchivedAtUtc = null;
                break;
            case CatalogItemStatuses.Archived:
                item.ArchivedAtUtc = now;
                break;
        }
        item.Status = target;
    }

    /// <summary>Replaces the ordered gallery. Assets must already exist and belong to the same business.</summary>
    private async Task ReplaceGalleriesAsync(CatalogItem item, IReadOnlyList<Guid> mediaAssetIds, IReadOnlyList<string> altTexts,
        Guid businessId, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (mediaAssetIds.Count > 12)
            throw ApiException.BadRequest("GALLERY_TOO_LARGE", "A catalogue item accepts at most 12 images.");
        if (mediaAssetIds.Count != mediaAssetIds.Distinct().Count())
            throw ApiException.BadRequest("DUPLICATE_GALLERY_IMAGE", "Each image may appear only once in a gallery.");

        // Reordering reuses the same (item, sort order) values, so the previous rows must be gone before the
        // replacements are inserted. A set-based DELETE lands immediately inside the ambient transaction and
        // keeps the change tracker out of the picture entirely.
        await db.CatalogItemMediaLinks.Where(x => x.CatalogItemId == item.Id).ExecuteDeleteAsync(cancellationToken);

        if (mediaAssetIds.Count == 0) return;
        var assets = await db.MediaAssets.AsNoTracking()
            .Where(x => mediaAssetIds.Contains(x.Id) && x.BusinessId == businessId && x.Status == MediaAssetStatuses.Ready)
            .ToListAsync(cancellationToken);
        var missing = mediaAssetIds.Expected(assets.Select(x => x.Id));
        if (missing.Count > 0)
            throw ApiException.Unprocessable("MEDIA_ASSET_NOT_USABLE",
                $"Media asset(s) {string.Join(", ", missing)} are not available for this business. Upload them first.");

        var byId = assets.ToDictionary(x => x.Id);
        for (var index = 0; index < mediaAssetIds.Count; index++)
        {
            var asset = byId[mediaAssetIds[index]];
            // Added through the DbSet, not through the principal's collection navigation: a loaded collection
            // makes EF treat the child set as complete and emit deletes for rows it never loaded.
            db.CatalogItemMediaLinks.Add(new CatalogItemMedia
            {
                Id = Guid.NewGuid(), CatalogItemId = item.Id, MediaAssetId = asset.Id, SortOrder = index,
                AltText = index < altTexts.Count ? (altTexts[index] ?? string.Empty).Trim() : string.Empty,
                CreatedAtUtc = now
            });
        }
    }

    private async Task<Dictionary<Guid, List<(CatalogItemMedia Link, MediaAsset? Asset)>>> LoadGalleriesAsync(
        IEnumerable<Guid> itemIds, CancellationToken cancellationToken)
    {
        var ids = itemIds.Distinct().ToArray();
        if (ids.Length == 0) return [];
        var links = await db.CatalogItemMediaLinks.AsNoTracking()
            .Where(x => ids.Contains(x.CatalogItemId))
            .OrderBy(x => x.CatalogItemId).ThenBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);
        var assetIds = links.Select(x => x.MediaAssetId).Distinct().ToArray();
        var assets = await db.MediaAssets.AsNoTracking().Where(x => assetIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);
        return links.GroupBy(x => x.CatalogItemId).ToDictionary(
            g => g.Key,
            g => g.Select(l => (Link: l, Asset: assets.GetValueOrDefault(l.MediaAssetId))).ToList());
    }


    /// <summary>SKU uniqueness is scoped to the business, matching the filtered unique index.</summary>
    private async Task EnsureSkuAvailableAsync(Guid businessId, string? sku, Guid? exceptItemId, CancellationToken cancellationToken)
    {
        if (sku is null) return;
        if (await db.CatalogItems.AnyAsync(x => x.BusinessId == businessId && x.Sku == sku && x.Id != exceptItemId
                                                && x.Status != CatalogItemStatuses.Archived, cancellationToken))
            throw ApiException.Conflict("DUPLICATE_SKU", $"The SKU '{sku}' is already used by another item in this catalogue.");
    }

    private async Task<string> UniqueSlugAsync(Guid businessId, string title, CancellationToken cancellationToken, Guid? exceptItemId = null)
    {
        var baseSlug = new string(title.Trim().ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        baseSlug = string.Join('-', baseSlug.Split('-', StringSplitOptions.RemoveEmptyEntries));
        if (baseSlug.Length == 0) baseSlug = "item";
        if (baseSlug.Length > 125) baseSlug = baseSlug[..125].TrimEnd('-');
        var slug = baseSlug;
        for (var suffix = 2; await db.CatalogItems.AnyAsync(x => x.BusinessId == businessId && x.Slug == slug && x.Id != exceptItemId, cancellationToken); suffix++)
        {
            var tail = $"-{suffix}";
            slug = baseSlug[..Math.Min(baseSlug.Length, 160 - tail.Length)] + tail;
        }
        return slug;
    }

    private void AddActivity(Guid businessId, Guid actorId, string eventType, string summary, DateTimeOffset now) =>
        db.BusinessActivities.Add(new BusinessActivity
        {
            Id = Guid.NewGuid(), BusinessId = businessId, ActorUserId = actorId,
            EventType = eventType, Summary = summary, CreatedAtUtc = now
        });

    private async Task NotifyPublishedAsync(Guid actorId, Mabiz.Domain.Businesses.Business business, CatalogItem item, CancellationToken cancellationToken)
    {
        var recipients = await db.BusinessFollows.AsNoTracking().Where(x => x.BusinessId == business.Id).Select(x => x.UserId).ToListAsync(cancellationToken);
        var publishedAtTicks = item.PublishedAtUtc?.UtcDateTime.Ticks ?? item.CreatedAtUtc.UtcDateTime.Ticks;
        await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, recipients, "catalogue_update",
            $"New item from {business.Name}", $"{business.Name} published a {item.Kind}.", "catalog_item", item.Id,
            $"catalogue-published:{item.Id:N}:{publishedAtTicks}", business.Id, CatalogItemId: item.Id), cancellationToken);
    }

    private static void ValidateKind(string kind, string? sku, int? stock, bool? inStock, string? unit, string? availability,
        int? leadTime, int? duration, string? visitType, IEnumerable<string>? serviceAreas)
    {
        if (!CatalogItemKinds.All.Contains(kind))
            throw ApiException.BadRequest("INVALID_CATALOGUE_KIND", "Kind must be 'product' or 'service'.");
        var areas = serviceAreas?.ToArray() ?? [];
        if (areas.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 100))
            throw ApiException.BadRequest("INVALID_SERVICE_AREA", "Service areas must be non-empty and at most 100 characters.");

        if (kind == CatalogItemKinds.Product)
        {
            if (leadTime is not null || duration is not null || visitType is not null)
                throw ApiException.Unprocessable("PRODUCT_FIELDS_INVALID", "Lead time, duration and visit type apply to services only.");
            if (areas.Length > 0)
                throw ApiException.Unprocessable("PRODUCT_FIELDS_INVALID", "Service areas apply to services only.");
            if (availability is not null && availability != CatalogAvailability.Available)
                throw ApiException.Unprocessable("PRODUCT_FIELDS_INVALID", "Products always use the 'available' status; use stock instead.");
        }
        else
        {
            if (sku is not null || stock is not null || inStock is not null || unit is not null)
                throw ApiException.Unprocessable("SERVICE_FIELDS_INVALID", "SKU, stock and unit apply to products only.");
            if (availability is not null && !CatalogAvailability.All.Contains(availability))
                throw ApiException.BadRequest("INVALID_AVAILABILITY", "Availability must be one of available, on_request, fully_booked, seasonal.");
            if (visitType is not null && !CatalogVisitTypes.All.Contains(visitType))
                throw ApiException.BadRequest("INVALID_VISIT_TYPE", "Visit type must be onsite, remote or hybrid.");
        }
    }

    private static void ValidatePricing(decimal? price, string? priceNote, bool negotiable)
    {
        if (price is < 0) throw ApiException.BadRequest("INVALID_PRICE", "Price cannot be negative.");
        if (price is null && string.IsNullOrWhiteSpace(priceNote) && !negotiable)
            throw ApiException.Unprocessable("PRICE_REQUIRED", "An item needs a price, a price note or the negotiable flag.");
    }

    private static void ValidateCategory(string category, string? subcategory)
    {
        if (string.IsNullOrWhiteSpace(category))
            throw ApiException.BadRequest("CATEGORY_REQUIRED", "A category is required.");
        if (category.Trim().Length > 80 || (subcategory?.Length > 80))
            throw ApiException.BadRequest("CATEGORY_TOO_LONG", "Category and subcategory are limited to 80 characters.");
    }

    private static string NormalizeAvailability(string kind, string? requested)
    {
        if (kind == CatalogItemKinds.Product) return CatalogAvailability.Available;
        var value = string.IsNullOrWhiteSpace(requested) ? CatalogAvailability.Available : requested.Trim().ToLowerInvariant();
        return CatalogAvailability.All.Contains(value) ? value : CatalogAvailability.Available;
    }

    private CatalogItemResponse Map(CatalogItem item, Business business, List<(CatalogItemMedia Link, MediaAsset? Asset)> gallery, string? role) => new(
        item.Id.ToString(), item.BusinessId.ToString(), business.Name, business.Slug, item.Kind, item.Title, item.Slug,
        item.Description, item.Category, item.Subcategory, item.PriceKsh, item.PriceNote, item.Currency, item.PriceNegotiable,
        item.Sku, item.StockQuantity, item.InStock, item.Unit, item.AvailabilityStatus, item.LeadTimeDays, item.DurationMinutes,
        item.ServiceAreas, item.VisitType, item.Status, item.Status == CatalogItemStatuses.Published, DeserializeAttributes(item.AttributesJson),
        gallery.Select(entry => MapMedia(entry.Link, entry.Asset)).ToList(),
        item.CreatedAtUtc, item.UpdatedAtUtc, item.PublishedAtUtc, item.ArchivedAtUtc, role);

    private CatalogPublicItemResponse MapPublic(CatalogItem item, Business business, List<(CatalogItemMedia Link, MediaAsset? Asset)> gallery)
    {
        var summary = item.Description.Length <= 200 ? item.Description : item.Description[..200].TrimEnd() + "...";
        return new CatalogPublicItemResponse(
            item.Id.ToString(), item.Kind, item.Title, item.Slug, summary, item.Category, item.Subcategory,
            item.PriceKsh, item.PriceNote, item.Currency, item.PriceNegotiable, item.Sku, item.InStock,
            item.AvailabilityStatus, item.DurationMinutes, item.VisitType,
            gallery.Select(entry => MapMedia(entry.Link, entry.Asset)).ToList(),
            business.Id.ToString(), business.Name, business.Slug, business.County, business.Town,
            item.PublishedAtUtc ?? item.CreatedAtUtc, item.UpdatedAtUtc);
    }

    private static CatalogMediaResponse MapMedia(CatalogItemMedia link, MediaAsset? asset) => new(
        link.MediaAssetId.ToString(), link.SortOrder, link.AltText,
        $"/api/v1/media/{link.MediaAssetId}/content",
        asset?.ContentType ?? "application/octet-stream", asset?.SizeBytes ?? 0,
        asset?.WidthPx, asset?.HeightPx, asset?.Provider ?? MediaStorageProviders.Local);

    private static void ValidateAttributes(IDictionary<string, string> attributes)
    {
        if (attributes.Any(x => string.IsNullOrWhiteSpace(x.Key) || x.Key.Length > 40 || x.Value.Length > 200))
            throw ApiException.BadRequest("INVALID_ATTRIBUTE", "Attribute keys are 1-40 characters and values at most 200 characters.");
    }

    private static string SerializeAttributes(IDictionary<string, string>? attributes)
    {
        var map = attributes ?? new Dictionary<string, string>();
        ValidateAttributes(map);
        return JsonSerializer.Serialize(map.Where(x => !string.IsNullOrWhiteSpace(x.Value))
            .ToDictionary(x => x.Key.Trim(), x => x.Value.Trim(), StringComparer.OrdinalIgnoreCase), JsonOptions);
    }

    private static IReadOnlyDictionary<string, string> DeserializeAttributes(string json)
    {
        try { return JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOptions) ?? new Dictionary<string, string>(); }
        catch (JsonException) { return new Dictionary<string, string>(); }
    }

    private static string? NormalizeNullable(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string? NormalizeUppercase(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToUpperInvariant();
    private static string[] NormalizeList(IEnumerable<string> values) => values.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
    private static (int page, int pageSize) NormalizePage(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
}

internal static class GuidExtensions
{
    /// <summary>Ids the caller asked for that the database did not return.</summary>
    public static IReadOnlyList<Guid> Expected(this IReadOnlyCollection<Guid> requested, IEnumerable<Guid> available)
    {
        var have = available.ToHashSet();
        return requested.Where(x => !have.Contains(x)).ToList();
    }
}
