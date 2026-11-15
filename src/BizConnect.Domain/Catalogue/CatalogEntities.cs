namespace BizConnect.Domain.Catalogue;

public static class CatalogItemKinds
{
    public const string Product = "product";
    public const string Service = "service";
    public static readonly string[] All = [Product, Service];
}

public static class CatalogItemStatuses
{
    public const string Draft = "draft";
    public const string Published = "published";
    public const string Archived = "archived";
    public static readonly string[] All = [Draft, Published, Archived];
}

public static class CatalogAvailability
{
    public const string Available = "available";
    public const string OnRequest = "on_request";
    public const string FullyBooked = "fully_booked";
    public const string Seasonal = "seasonal";
    public static readonly string[] All = [Available, OnRequest, FullyBooked, Seasonal];
}

public static class CatalogVisitTypes
{
    public const string OnSite = "onsite";
    public const string Remote = "remote";
    public const string Hybrid = "hybrid";
    public static readonly string[] All = [OnSite, Remote, Hybrid];
}

/// <summary>
/// A single sellable product or bookable service listed by a business. Kind-specific columns stay on one
/// row so catalogue management, discovery and search share one query path.
/// </summary>
public sealed class CatalogItem
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Kind { get; set; } = CatalogItemKinds.Product;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Subcategory { get; set; } = string.Empty;
    public decimal? PriceKsh { get; set; }
    public string PriceNote { get; set; } = string.Empty;
    public string Currency { get; set; } = "KES";
    public bool PriceNegotiable { get; set; }
    public string? Sku { get; set; }
    public int? StockQuantity { get; set; }
    public bool? InStock { get; set; }
    public string? Unit { get; set; }
    public string AvailabilityStatus { get; set; } = CatalogAvailability.Available;
    public int? LeadTimeDays { get; set; }
    public int? DurationMinutes { get; set; }
    public string[] ServiceAreas { get; set; } = [];
    public string? VisitType { get; set; }
    public string Status { get; set; } = CatalogItemStatuses.Draft;
    public string AttributesJson { get; set; } = "{}";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? PublishedAtUtc { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
    public List<CatalogItemMedia> Media { get; set; } = [];
}

/// <summary>An ordered gallery entry linking a catalogue item to an uploaded media asset.</summary>
public sealed class CatalogItemMedia
{
    public Guid Id { get; set; }
    public Guid CatalogItemId { get; set; }
    public Guid MediaAssetId { get; set; }
    public int SortOrder { get; set; }
    public string AltText { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }

    // No MediaAsset navigation on purpose: galleries are assembled by loading assets by id in one query.
    // A navigation here makes EF treat a new row whose reference is unset as a required-principal change
    // and emit a DELETE for a row that was never inserted.
}
