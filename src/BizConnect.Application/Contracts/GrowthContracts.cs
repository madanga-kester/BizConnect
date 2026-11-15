using System.ComponentModel.DataAnnotations;

namespace BizConnect.Application.Contracts;

public sealed record CreateReviewRequest
{
    [Range(1, 5)] public int Rating { get; init; }
    [Required, StringLength(2000)] public string Comment { get; init; } = string.Empty;
}
public sealed record UpdateReviewRequest
{
    [Range(1, 5)] public int? Rating { get; init; }
    [StringLength(2000)] public string? Comment { get; init; }
}
public sealed record ReviewResponse(Guid Id, Guid BusinessId, Guid ReviewerUserId, string? ReviewerName, int Rating, string Comment, string Status, string? OwnerResponse, DateTimeOffset? OwnerRespondedAt, DateTimeOffset CreatedAt);
public sealed record ReviewPageResponse(IReadOnlyList<ReviewResponse> Items, int Total, decimal AverageRating, int Page, int PageSize);
public sealed record OwnerResponseRequest { [Required, StringLength(2000)] public string Response { get; init; } = string.Empty; }
public sealed record ReportReviewRequest { [Required, StringLength(1000)] public string Reason { get; init; } = string.Empty; }

public sealed record CreateMilestoneRequest
{
    [Required, StringLength(160)] public string Title { get; init; } = string.Empty;
    [StringLength(2000)] public string? Description { get; init; }
    public DateTimeOffset AchievedAt { get; init; }
    [RegularExpression("^(public|private)$")] public string Visibility { get; init; } = "public";
}
public sealed record UpdateMilestoneRequest
{
    [StringLength(160)] public string? Title { get; init; }
    [StringLength(2000)] public string? Description { get; init; }
    public DateTimeOffset? AchievedAt { get; init; }
    [RegularExpression("^(public|private)$")] public string? Visibility { get; init; }
}
public sealed record MilestoneResponse(Guid Id, Guid BusinessId, string Title, string? Description, DateTimeOffset AchievedAt, bool IsSelfReported, string Visibility, DateTimeOffset CreatedAt);

public sealed record CreateOpportunityRequest
{
    [Required, StringLength(180)] public string Title { get; init; } = string.Empty;
    [Required, StringLength(4000)] public string Description { get; init; } = string.Empty;
    [Required, StringLength(80)] public string Category { get; init; } = string.Empty;
    [Range(0, 1000000000)] public decimal? Budget { get; init; }
    [StringLength(3, MinimumLength = 3)] public string Currency { get; init; } = "KES";
    public DateTimeOffset ExpiresAt { get; init; }
}
public sealed record UpdateOpportunityRequest
{
    [StringLength(180)] public string? Title { get; init; }
    [StringLength(4000)] public string? Description { get; init; }
    [StringLength(80)] public string? Category { get; init; }
    [Range(0, 1000000000)] public decimal? Budget { get; init; }
    [StringLength(3, MinimumLength = 3)] public string? Currency { get; init; }
    public DateTimeOffset? ExpiresAt { get; init; }
    [RegularExpression("^(open|closed)$")] public string? Status { get; init; }
}
public sealed record OpportunityResponse(Guid Id, Guid BusinessId, Guid CreatedByUserId, string Title, string Description, string Category, decimal? Budget, string Currency, DateTimeOffset ExpiresAt, string Status, bool IsExpired, DateTimeOffset CreatedAt);
public sealed record OpportunityPageResponse(IReadOnlyList<OpportunityResponse> Items, int Total, int Page, int PageSize);
public sealed record EnquiryEntryResponse(Guid OpportunityId, Guid BusinessId, string EntryPoint, string SuggestedSubject);

public sealed record RecordAnalyticsEventRequest
{
    [Required, StringLength(80)] public string EventType { get; init; } = string.Empty;
    [StringLength(40)] public string? SubjectType { get; init; }
    public Guid? SubjectId { get; init; }
    [StringLength(4000)] public string? MetadataJson { get; init; }
}
public sealed record AnalyticsMetricResponse(string EventType, int Count);
public sealed record AnalyticsDashboardResponse(Guid BusinessId, DateTimeOffset From, DateTimeOffset To, int TotalEvents, IReadOnlyList<AnalyticsMetricResponse> Metrics, int ProfileViews, int Enquiries, int Reviews, decimal AverageRating);
public sealed record GrowthSummaryResponse(Guid BusinessId, decimal AverageRating, int ReviewCount, int MilestoneCount, int OpenOpportunityCount, int ProfileViews, int Enquiries, DateTimeOffset From, DateTimeOffset To);
