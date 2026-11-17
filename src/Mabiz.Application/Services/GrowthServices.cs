using Mabiz.Application.Contracts;

namespace Mabiz.Application.Services;

public interface IGrowthService
{
    Task<ReviewPageResponse> ListReviewsAsync(Guid businessId, Guid? viewerId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ReviewResponse> CreateReviewAsync(Guid actorId, Guid businessId, CreateReviewRequest request, CancellationToken cancellationToken);
    Task<ReviewResponse> UpdateReviewAsync(Guid actorId, Guid businessId, Guid reviewId, UpdateReviewRequest request, CancellationToken cancellationToken);
    Task DeleteReviewAsync(Guid actorId, Guid businessId, Guid reviewId, CancellationToken cancellationToken);
    Task<ReviewResponse> RespondToReviewAsync(Guid actorId, Guid businessId, Guid reviewId, OwnerResponseRequest request, CancellationToken cancellationToken);
    Task ReportReviewAsync(Guid actorId, Guid businessId, Guid reviewId, ReportReviewRequest request, CancellationToken cancellationToken);
    Task<MilestoneResponse> CreateMilestoneAsync(Guid actorId, Guid businessId, CreateMilestoneRequest request, CancellationToken cancellationToken);
    Task<MilestoneResponse> UpdateMilestoneAsync(Guid actorId, Guid businessId, Guid milestoneId, UpdateMilestoneRequest request, CancellationToken cancellationToken);
    Task DeleteMilestoneAsync(Guid actorId, Guid businessId, Guid milestoneId, CancellationToken cancellationToken);
    Task<IReadOnlyList<MilestoneResponse>> ListMilestonesAsync(Guid businessId, Guid? viewerId, CancellationToken cancellationToken);
    Task<OpportunityResponse> CreateOpportunityAsync(Guid actorId, Guid businessId, CreateOpportunityRequest request, CancellationToken cancellationToken);
    Task<OpportunityResponse> UpdateOpportunityAsync(Guid actorId, Guid businessId, Guid opportunityId, UpdateOpportunityRequest request, CancellationToken cancellationToken);
    Task DeleteOpportunityAsync(Guid actorId, Guid businessId, Guid opportunityId, CancellationToken cancellationToken);
    Task<OpportunityPageResponse> SearchOpportunitiesAsync(Guid? viewerId, string? query, string? category, bool includeExpired, int page, int pageSize, CancellationToken cancellationToken);
    Task<OpportunityResponse> GetOpportunityAsync(Guid opportunityId, Guid? viewerId, CancellationToken cancellationToken);
    Task<EnquiryEntryResponse> StartOpportunityEnquiryAsync(Guid actorId, Guid opportunityId, CancellationToken cancellationToken);
    Task RecordAnalyticsEventAsync(Guid businessId, Guid? actorId, RecordAnalyticsEventRequest request, CancellationToken cancellationToken);
    Task<AnalyticsDashboardResponse> GetAnalyticsAsync(Guid actorId, Guid businessId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
    Task<GrowthSummaryResponse> GetGrowthSummaryAsync(Guid? viewerId, Guid businessId, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken);
}
