namespace Mabiz.Domain.Businesses;

public static class ReviewStatuses
{
    public const string Published = "published";
    public const string Hidden = "hidden";
    public const string Reported = "reported";
}

public sealed class BusinessReview
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Status { get; set; } = ReviewStatuses.Published;
    public string? OwnerResponse { get; set; }
    public DateTimeOffset? OwnerRespondedAtUtc { get; set; }
    public Guid? OwnerRespondedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class BusinessMilestone
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset AchievedAtUtc { get; set; }
    public bool IsSelfReported { get; set; } = true;
    public string Visibility { get; set; } = BusinessVisibility.Public;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class BusinessOpportunity
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal? Budget { get; set; }
    public string Currency { get; set; } = "KES";
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public string Status { get; set; } = "open";
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class BusinessAnalyticsEvent
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? SubjectType { get; set; }
    public Guid? SubjectId { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
