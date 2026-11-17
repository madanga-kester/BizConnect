using System.ComponentModel.DataAnnotations;

namespace Mabiz.Application.Contracts;

public sealed record BusinessCreateRequest
{
    [Required, StringLength(120, MinimumLength = 2)] public string Name { get; init; } = string.Empty;
    [Required, RegularExpression("^(products|services|hybrid)$")] public string BusinessType { get; init; } = "hybrid";
    [Required, StringLength(80)] public string Category { get; init; } = string.Empty;
    [Required, StringLength(80)] public string Subcategory { get; init; } = string.Empty;
    [Required, StringLength(280)] public string Description { get; init; } = string.Empty;
    [Required, StringLength(4000)] public string About { get; init; } = string.Empty;
    [Required, StringLength(120)] public string Founder { get; init; } = string.Empty;
    [Required, StringLength(4000)] public string OriginStory { get; init; } = string.Empty;
    [Required, StringLength(80)] public string County { get; init; } = string.Empty;
    [Required, StringLength(100)] public string Town { get; init; } = string.Empty;
    [StringLength(100)] public string Neighbourhood { get; init; } = string.Empty;
    [MaxLength(30)] public List<string> ServiceAreas { get; init; } = [];
    [RegularExpression("^(?:\\+254|254|0)?(?:7|1)[0-9]{8}$|^$", ErrorMessage = "Use a valid Kenyan phone number.")] public string? Phone { get; init; }
    [RegularExpression("^(?:\\+254|254|0)?(?:7|1)[0-9]{8}$|^$", ErrorMessage = "Use a valid Kenyan WhatsApp number.")] public string? Whatsapp { get; init; }
    [EmailAddress, StringLength(254)] public string? Email { get; init; }
    [Url, StringLength(2048)] public string? Website { get; init; }
    [RegularExpression("^(KSh|KSh KSh|KSh KSh KSh)$")] public string PriceRange { get; init; } = "KSh KSh";
    [StringLength(500)] public string OperatingHours { get; init; } = string.Empty;
    [Url, StringLength(2048)] public string? Logo { get; init; }
    [Url, StringLength(2048)] public string? Cover { get; init; }
    [RegularExpression("^(public|private)$")] public string Visibility { get; init; } = "public";
    [MaxLength(12)] public Dictionary<string, string> SocialLinks { get; init; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed record BusinessUpdateRequest
{
    [StringLength(120, MinimumLength = 2)] public string? Name { get; init; }
    [RegularExpression("^(products|services|hybrid)$")] public string? BusinessType { get; init; }
    [StringLength(80)] public string? Category { get; init; }
    [StringLength(80)] public string? Subcategory { get; init; }
    [StringLength(280)] public string? Description { get; init; }
    [StringLength(4000)] public string? About { get; init; }
    [StringLength(120)] public string? Founder { get; init; }
    [StringLength(4000)] public string? OriginStory { get; init; }
    [StringLength(80)] public string? County { get; init; }
    [StringLength(100)] public string? Town { get; init; }
    [StringLength(100)] public string? Neighbourhood { get; init; }
    [MaxLength(30)] public List<string>? ServiceAreas { get; init; }
    [RegularExpression("^(?:\\+254|254|0)?(?:7|1)[0-9]{8}$|^$", ErrorMessage = "Use a valid Kenyan phone number.")] public string? Phone { get; init; }
    [RegularExpression("^(?:\\+254|254|0)?(?:7|1)[0-9]{8}$|^$", ErrorMessage = "Use a valid Kenyan WhatsApp number.")] public string? Whatsapp { get; init; }
    [EmailAddress, StringLength(254)] public string? Email { get; init; }
    [Url, StringLength(2048)] public string? Website { get; init; }
    [RegularExpression("^(KSh|KSh KSh|KSh KSh KSh)$")] public string? PriceRange { get; init; }
    [StringLength(500)] public string? OperatingHours { get; init; }
    [Url, StringLength(2048)] public string? Logo { get; init; }
    [Url, StringLength(2048)] public string? Cover { get; init; }
    [RegularExpression("^(public|private)$")] public string? Visibility { get; init; }
    [MaxLength(12)] public Dictionary<string, string>? SocialLinks { get; init; }
}

public sealed record BusinessProfileResponse(
    string Id, string OwnerId, string Slug, string Name, string BusinessType,
    string Category, string Subcategory, string Description, string About, string Founder,
    string FounderId, string OriginStory, string County, string Town, string Neighbourhood,
    IReadOnlyList<string> ServiceAreas, string? Phone, string? Whatsapp, string? Email,
    string? Website, string PriceRange, string OperatingHours, string? Logo, string? Cover,
    string Visibility, string Status, IReadOnlyDictionary<string, string> SocialLinks,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, string? CurrentUserRole);

public sealed record BusinessListResponse(IReadOnlyList<BusinessProfileResponse> Items, int Total, int Page, int PageSize);
public sealed record BusinessMemberResponse(string UserId, string Role, DateTimeOffset JoinedAt, string DisplayName, string? Email, string? Avatar);
public sealed record BusinessMembersResponse(IReadOnlyList<BusinessMemberResponse> Items, int Total, int Page, int PageSize);

public sealed record CreateBusinessInvitationRequest
{
    [Required, EmailAddress, StringLength(254)] public string Email { get; init; } = string.Empty;
    [Required, RegularExpression("^(Admin|Editor|Viewer)$")] public string Role { get; init; } = "Viewer";
    [StringLength(500)] public string? Message { get; init; }
}

public sealed record UpdateBusinessMemberRoleRequest
{
    [Required, RegularExpression("^(Admin|Editor|Viewer)$")] public string Role { get; init; } = "Viewer";
}

public sealed record BusinessInvitationResponse(
    string Id, string BusinessId, string BusinessName, string InvitedUserId, string InvitedEmail,
    string Role, string Status, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt,
    string InvitedByUserId, string InvitedByName);
public sealed record BusinessInvitationsResponse(IReadOnlyList<BusinessInvitationResponse> Items, int Total, int Page, int PageSize);

public sealed record CreateOwnershipTransferRequest
{
    [Required, EmailAddress, StringLength(254)] public string NewOwnerEmail { get; init; } = string.Empty;
    [StringLength(500)] public string? Message { get; init; }
}

public sealed record OwnershipTransferResponse(
    string Id, string BusinessId, string BusinessName, string FromUserId, string FromName,
    string ToUserId, string ToEmail, string Status, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt);
public sealed record OwnershipTransfersResponse(IReadOnlyList<OwnershipTransferResponse> Items);
public sealed record BusinessActivityResponse(string Id, string BusinessId, string ActorUserId, string ActorName, string EventType, string Summary, DateTimeOffset CreatedAt);
public sealed record BusinessActivityListResponse(IReadOnlyList<BusinessActivityResponse> Items, int Total, int Page, int PageSize);
