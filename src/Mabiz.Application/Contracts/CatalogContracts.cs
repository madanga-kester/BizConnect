using System.ComponentModel.DataAnnotations;

namespace Mabiz.Application.Contracts;

/// <summary>Gallery entry as returned to clients. AccessUrl is always the Mabiz proxy path, never a raw provider URL.</summary>
public sealed record CatalogMediaResponse(
    string MediaAssetId, int SortOrder, string AltText, string AccessUrl, string ContentType,
    long SizeBytes, int? WidthPx, int? HeightPx, string Provider);

/// <summary>
/// Creates a catalogue item. The kind is taken from the route segment (products or services) and never
/// from the body, so a client cannot create a service through the products path or silently inherit the
/// wrong kind-specific defaults by omitting the field.
/// </summary>
public sealed record CatalogItemCreateRequest
{
    [Required, StringLength(120, MinimumLength = 2)] public string Title { get; init; } = string.Empty;
    [Required, StringLength(2000)] public string Description { get; init; } = string.Empty;
    [Required, StringLength(80)] public string Category { get; init; } = string.Empty;
    [StringLength(80)] public string Subcategory { get; init; } = string.Empty;
    [Range(0, 100000000)] public decimal? PriceKsh { get; init; }
    [StringLength(200)] public string? PriceNote { get; init; }
    [RegularExpression("^KES$")] public string Currency { get; init; } = "KES";
    public bool PriceNegotiable { get; init; }
    [StringLength(64, MinimumLength = 1)] public string? Sku { get; init; }
    [Range(0, 1000000000)] public int? StockQuantity { get; init; }
    public bool? InStock { get; init; }
    [StringLength(32)] public string? Unit { get; init; }
    [RegularExpression("^(available|on_request|fully_booked|seasonal)$")] public string? AvailabilityStatus { get; init; }
    [Range(0, 3650)] public int? LeadTimeDays { get; init; }
    [Range(1, 43200)] public int? DurationMinutes { get; init; }
    [MaxLength(20)] public List<string> ServiceAreas { get; init; } = [];
    [RegularExpression("^(onsite|remote|hybrid)$")] public string? VisitType { get; init; }
    [RegularExpression("^(draft|published)$")] public string? Status { get; init; }
    [MaxLength(12)] public List<Guid> MediaAssetIds { get; init; } = [];
    [MaxLength(20)] public Dictionary<string, string> Attributes { get; init; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed record CatalogItemUpdateRequest
{
    [StringLength(120, MinimumLength = 2)] public string? Title { get; init; }
    [StringLength(2000)] public string? Description { get; init; }
    [StringLength(80)] public string? Category { get; init; }
    [StringLength(80)] public string? Subcategory { get; init; }
    [Range(0, 100000000)] public decimal? PriceKsh { get; init; }
    public bool? ClearPrice { get; init; }
    [StringLength(200)] public string? PriceNote { get; init; }
    public bool? PriceNegotiable { get; init; }
    [StringLength(64, MinimumLength = 1)] public string? Sku { get; init; }
    [Range(0, 1000000000)] public int? StockQuantity { get; init; }
    public bool? InStock { get; init; }
    [StringLength(32)] public string? Unit { get; init; }
    [RegularExpression("^(available|on_request|fully_booked|seasonal)$")] public string? AvailabilityStatus { get; init; }
    [Range(0, 3650)] public int? LeadTimeDays { get; init; }
    [Range(1, 43200)] public int? DurationMinutes { get; init; }
    [MaxLength(20)] public List<string>? ServiceAreas { get; init; }
    [RegularExpression("^(onsite|remote|hybrid)$")] public string? VisitType { get; init; }
    [MaxLength(12)] public List<Guid>? MediaAssetIds { get; init; }
    [MaxLength(24)] public List<string>? AltTexts { get; init; }
    [MaxLength(20)] public Dictionary<string, string>? Attributes { get; init; }
    [RegularExpression("^(draft|published)$")] public string? Status { get; init; }
}

/// <summary>Replaces the ordered gallery in one atomic write.</summary>
public sealed record CatalogMediaReplaceRequest
{
    [MaxLength(12)] public List<Guid> MediaAssetIds { get; init; } = [];
    [MaxLength(24)] public List<string> AltTexts { get; init; } = [];
}

/// <summary>Explicit lifecycle transition: draft, published or archived.</summary>
public sealed record CatalogStatusRequest
{
    [Required, RegularExpression("^(draft|published|archived)$")] public string Status { get; init; } = CatalogStatusDefault.Draft;
}

internal static class CatalogStatusDefault
{
    public const string Draft = "draft";
}

public sealed record CatalogItemResponse(
    string Id, string BusinessId, string BusinessName, string BusinessSlug, string Kind, string Title, string Slug,
    string Description, string Category, string Subcategory, decimal? PriceKsh, string PriceNote, string Currency,
    bool PriceNegotiable, string? Sku, int? StockQuantity, bool? InStock, string? Unit,
    string AvailabilityStatus, int? LeadTimeDays, int? DurationMinutes, IReadOnlyList<string> ServiceAreas,
    string? VisitType, string Status, bool IsPublished, IReadOnlyDictionary<string, string> Attributes,
    IReadOnlyList<CatalogMediaResponse> Media, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    DateTimeOffset? PublishedAt, DateTimeOffset? ArchivedAt, string? CurrentUserRole);

public sealed record CatalogItemPageResponse(IReadOnlyList<CatalogItemResponse> Items, int Total, int Page, int PageSize);

public sealed record CatalogPublicItemResponse(
    string Id, string Kind, string Title, string Slug, string Summary, string Category, string Subcategory,
    decimal? PriceKsh, string PriceNote, string Currency, bool PriceNegotiable, string? Sku, bool? InStock,
    string AvailabilityStatus, int? DurationMinutes, string? VisitType,
    IReadOnlyList<CatalogMediaResponse> Media,
    string BusinessId, string BusinessName, string BusinessSlug, string County, string Town,
    DateTimeOffset PublishedAt, DateTimeOffset UpdatedAt);

public sealed record CatalogPublicPageResponse(IReadOnlyList<CatalogPublicItemResponse> Items, int Total, int Page, int PageSize);
