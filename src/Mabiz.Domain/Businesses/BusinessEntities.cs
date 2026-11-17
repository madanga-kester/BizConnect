namespace Mabiz.Domain.Businesses;

public static class BusinessRoles
{
    public const string Owner = "Owner";
    public const string Admin = "Admin";
    public const string Editor = "Editor";
    public const string Viewer = "Viewer";
    public static readonly string[] All = [Owner, Admin, Editor, Viewer];
}

public static class BusinessStatuses
{
    public const string Active = "active";
    public const string Archived = "archived";
}

public static class BusinessVisibility
{
    public const string Public = "public";
    public const string Private = "private";
}

public static class InvitationStatuses
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Declined = "declined";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
}

public static class OwnershipTransferStatuses
{
    public const string Pending = "pending";
    public const string Accepted = "accepted";
    public const string Declined = "declined";
    public const string Cancelled = "cancelled";
    public const string Expired = "expired";
}

public sealed class Business
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string BusinessType { get; set; } = "hybrid";
    public string Category { get; set; } = string.Empty;
    public string Subcategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string About { get; set; } = string.Empty;
    public string Founder { get; set; } = string.Empty;
    public string OriginStory { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;
    public string Town { get; set; } = string.Empty;
    public string Neighbourhood { get; set; } = string.Empty;
    public string[] ServiceAreas { get; set; } = [];
    public string? Phone { get; set; }
    public string? Whatsapp { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string PriceRange { get; set; } = "KSh KSh";
    public string OperatingHours { get; set; } = string.Empty;
    public string SocialLinksJson { get; set; } = "{}";
    public string? Logo { get; set; }
    public string? Cover { get; set; }
    public string Visibility { get; set; } = BusinessVisibility.Public;
    public string Status { get; set; } = BusinessStatuses.Active;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}

public sealed class BusinessMembership
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = BusinessRoles.Viewer;
    public Guid GrantedByUserId { get; set; }
    public DateTimeOffset JoinedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}

public sealed class BusinessInvitation
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid InvitedUserId { get; set; }
    public Guid InvitedByUserId { get; set; }
    public string Role { get; set; } = BusinessRoles.Viewer;
    public string Status { get; set; } = InvitationStatuses.Pending;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RespondedAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}

public sealed class BusinessOwnershipTransfer
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string Status { get; set; } = OwnershipTransferStatuses.Pending;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RespondedAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
    public Guid Version { get; set; } = Guid.NewGuid();
}

public sealed class BusinessActivity
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid ActorUserId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public string? MetadataJson { get; set; }
}
