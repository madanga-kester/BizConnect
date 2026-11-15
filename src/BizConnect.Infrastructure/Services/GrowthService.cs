using System.Text.Json;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Businesses;
using BizConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Services;

public sealed class GrowthService(AppDbContext db, INotificationService notifications, TimeProvider clock) : IGrowthService
{
    private DateTimeOffset Now => clock.GetUtcNow();

    private async Task<Business> BusinessAsync(Guid id, CancellationToken ct) =>
        await db.Businesses.SingleOrDefaultAsync(x => x.Id == id && x.Status == BusinessStatuses.Active, ct)
        ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");

    private async Task<string?> RoleAsync(Guid userId, Guid businessId, CancellationToken ct) =>
        await db.BusinessMemberships.Where(x => x.BusinessId == businessId && x.UserId == userId && x.RevokedAtUtc == null).Select(x => x.Role).SingleOrDefaultAsync(ct);

    private async Task RequirePermissionAsync(Guid actorId, Guid businessId, BusinessPermission permission, CancellationToken ct)
    {
        var role = await RoleAsync(actorId, businessId, ct);
        if (!BusinessAccessControl.Allows(role, permission)) throw ApiException.Forbidden("BUSINESS_PERMISSION_REQUIRED", "You do not have permission for this business.");
    }

    public async Task<ReviewPageResponse> ListReviewsAsync(Guid businessId, Guid? viewerId, int page, int pageSize, CancellationToken ct)
    {
        var business = await BusinessAsync(businessId, ct);
        var role = viewerId.HasValue ? await RoleAsync(viewerId.Value, businessId, ct) : null;
        var canPrivate = viewerId.HasValue && BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile);
        var query = db.BusinessReviews.AsNoTracking().Where(x => x.BusinessId == business.Id && x.Status == ReviewStatuses.Published);
        var total = await query.CountAsync(ct);
        var average = total == 0 ? 0 : await query.AverageAsync(x => (decimal)x.Rating, ct);
        var items = await query.OrderByDescending(x => x.CreatedAtUtc).Skip(Math.Max(0, page - 1) * Math.Clamp(pageSize, 1, 100)).Take(Math.Clamp(pageSize, 1, 100))
            .Join(db.UserProfiles.AsNoTracking(), r => r.ReviewerUserId, p => p.UserId, (r, p) => new ReviewResponse(r.Id, r.BusinessId, r.ReviewerUserId, p.Name, r.Rating, r.Comment, r.Status, r.OwnerResponse, r.OwnerRespondedAtUtc, r.CreatedAtUtc)).ToListAsync(ct);
        return new ReviewPageResponse(items, total, average, page, pageSize);
    }

    public async Task<ReviewResponse> CreateReviewAsync(Guid actorId, Guid businessId, CreateReviewRequest request, CancellationToken ct)
    {
        var business = await BusinessAsync(businessId, ct);
        if (await RoleAsync(actorId, businessId, ct) is not null) throw ApiException.Forbidden("TEAM_CANNOT_REVIEW", "Business owners and team members cannot review their own business.");
        if (await db.BusinessReviews.AnyAsync(x => x.BusinessId == businessId && x.ReviewerUserId == actorId, ct)) throw ApiException.Conflict("REVIEW_ALREADY_EXISTS", "You have already reviewed this business.");
        var now = Now; var review = new BusinessReview { Id = Guid.NewGuid(), BusinessId = businessId, ReviewerUserId = actorId, Rating = request.Rating, Comment = request.Comment.Trim(), CreatedAtUtc = now, UpdatedAtUtc = now };
        db.BusinessReviews.Add(review);
        await notifications.CreateEventAsync(new NotificationEventRequest(actorId, [business.OwnerUserId], "business.review.created", "New business review", "Your business received a new review.", "business-review", review.Id, $"review:{review.Id}", BusinessId: businessId), ct);
        await db.SaveChangesAsync(ct);
        return await ReviewResponseAsync(review, ct);
    }

    public async Task<ReviewResponse> UpdateReviewAsync(Guid actorId, Guid businessId, Guid reviewId, UpdateReviewRequest request, CancellationToken ct)
    {
        var review = await db.BusinessReviews.SingleOrDefaultAsync(x => x.Id == reviewId && x.BusinessId == businessId && x.ReviewerUserId == actorId, ct)
            ?? throw ApiException.NotFound("REVIEW_NOT_FOUND", "The review was not found.");
        if (request.Rating.HasValue) review.Rating = request.Rating.Value;
        if (request.Comment is not null) review.Comment = request.Comment.Trim();
        if (string.IsNullOrWhiteSpace(review.Comment)) throw ApiException.BadRequest("REVIEW_COMMENT_REQUIRED", "Review text cannot be empty.");
        review.UpdatedAtUtc = Now;
        await db.SaveChangesAsync(ct);
        return await ReviewResponseAsync(review, ct);
    }
    public async Task DeleteReviewAsync(Guid actorId, Guid businessId, Guid reviewId, CancellationToken ct)
    {
        var review = await db.BusinessReviews.SingleOrDefaultAsync(x => x.Id == reviewId && x.BusinessId == businessId && x.ReviewerUserId == actorId, ct)
            ?? throw ApiException.NotFound("REVIEW_NOT_FOUND", "The review was not found.");
        db.BusinessReviews.Remove(review);
        await db.SaveChangesAsync(ct);
    }
    public async Task<ReviewResponse> RespondToReviewAsync(Guid actorId, Guid businessId, Guid reviewId, OwnerResponseRequest request, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.RespondToEnquiries, ct);
        var review = await db.BusinessReviews.SingleOrDefaultAsync(x => x.Id == reviewId && x.BusinessId == businessId, ct) ?? throw ApiException.NotFound("REVIEW_NOT_FOUND", "The review was not found.");
        review.OwnerResponse = request.Response.Trim(); review.OwnerRespondedAtUtc = Now; review.OwnerRespondedByUserId = actorId; review.UpdatedAtUtc = Now;
        await db.SaveChangesAsync(ct); return await ReviewResponseAsync(review, ct);
    }

    public async Task ReportReviewAsync(Guid actorId, Guid businessId, Guid reviewId, ReportReviewRequest request, CancellationToken ct)
    {
        var review = await db.BusinessReviews.SingleOrDefaultAsync(x => x.Id == reviewId && x.BusinessId == businessId && x.Status == ReviewStatuses.Published, ct) ?? throw ApiException.NotFound("REVIEW_NOT_FOUND", "The review was not found.");
        if (review.ReviewerUserId != actorId) throw ApiException.Forbidden("REVIEW_REPORT_FORBIDDEN", "Only the review author can report this review.");
        review.Status = ReviewStatuses.Reported; review.UpdatedAtUtc = Now; await db.SaveChangesAsync(ct);
    }

    public async Task<MilestoneResponse> CreateMilestoneAsync(Guid actorId, Guid businessId, CreateMilestoneRequest request, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.EditProfile, ct); await BusinessAsync(businessId, ct); var now = Now;
        var item = new BusinessMilestone { Id = Guid.NewGuid(), BusinessId = businessId, CreatedByUserId = actorId, Title = request.Title.Trim(), Description = request.Description?.Trim(), AchievedAtUtc = request.AchievedAt, Visibility = request.Visibility, CreatedAtUtc = now, UpdatedAtUtc = now, IsSelfReported = true };
        db.BusinessMilestones.Add(item); await db.SaveChangesAsync(ct); return Map(item);
    }

    public async Task<MilestoneResponse> UpdateMilestoneAsync(Guid actorId, Guid businessId, Guid milestoneId, UpdateMilestoneRequest request, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.EditProfile, ct); var item = await db.BusinessMilestones.SingleOrDefaultAsync(x => x.Id == milestoneId && x.BusinessId == businessId, ct) ?? throw ApiException.NotFound("MILESTONE_NOT_FOUND", "The milestone was not found.");
        if (request.Title is not null) item.Title = request.Title.Trim(); if (request.Description is not null) item.Description = request.Description.Trim(); if (request.AchievedAt.HasValue) item.AchievedAtUtc = request.AchievedAt.Value; if (request.Visibility is not null) item.Visibility = request.Visibility; item.UpdatedAtUtc = Now; await db.SaveChangesAsync(ct); return Map(item);
    }

    public async Task DeleteMilestoneAsync(Guid actorId, Guid businessId, Guid milestoneId, CancellationToken ct) { await RequirePermissionAsync(actorId, businessId, BusinessPermission.EditProfile, ct); var item = await db.BusinessMilestones.SingleOrDefaultAsync(x => x.Id == milestoneId && x.BusinessId == businessId, ct) ?? throw ApiException.NotFound("MILESTONE_NOT_FOUND", "The milestone was not found."); db.BusinessMilestones.Remove(item); await db.SaveChangesAsync(ct); }

    public async Task<IReadOnlyList<MilestoneResponse>> ListMilestonesAsync(Guid businessId, Guid? viewerId, CancellationToken ct)
    {
        var role = viewerId.HasValue ? await RoleAsync(viewerId.Value, businessId, ct) : null; var canPrivate = viewerId.HasValue && BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile);
        return await db.BusinessMilestones.AsNoTracking().Where(x => x.BusinessId == businessId && (x.Visibility == BusinessVisibility.Public || canPrivate)).OrderByDescending(x => x.AchievedAtUtc).Select(x => new MilestoneResponse(x.Id, x.BusinessId, x.Title, x.Description, x.AchievedAtUtc, x.IsSelfReported, x.Visibility, x.CreatedAtUtc)).ToListAsync(ct);
    }

    public async Task<OpportunityResponse> CreateOpportunityAsync(Guid actorId, Guid businessId, CreateOpportunityRequest request, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.RespondToEnquiries, ct); await BusinessAsync(businessId, ct); if (request.ExpiresAt <= Now) throw ApiException.BadRequest("OPPORTUNITY_EXPIRY_INVALID", "The opportunity expiry must be in the future."); var now = Now;
        var item = new BusinessOpportunity { Id = Guid.NewGuid(), BusinessId = businessId, CreatedByUserId = actorId, Title = request.Title.Trim(), Description = request.Description.Trim(), Category = request.Category.Trim(), Budget = request.Budget, Currency = request.Currency.ToUpperInvariant(), ExpiresAtUtc = request.ExpiresAt, CreatedAtUtc = now, UpdatedAtUtc = now };
        db.BusinessOpportunities.Add(item); await db.SaveChangesAsync(ct); return Map(item);
    }

    public async Task<OpportunityResponse> UpdateOpportunityAsync(Guid actorId, Guid businessId, Guid opportunityId, UpdateOpportunityRequest request, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.RespondToEnquiries, ct); var item = await db.BusinessOpportunities.SingleOrDefaultAsync(x => x.Id == opportunityId && x.BusinessId == businessId, ct) ?? throw ApiException.NotFound("OPPORTUNITY_NOT_FOUND", "The opportunity was not found.");
        if (request.Title is not null) item.Title = request.Title.Trim(); if (request.Description is not null) item.Description = request.Description.Trim(); if (request.Category is not null) item.Category = request.Category.Trim(); if (request.Budget.HasValue) item.Budget = request.Budget; if (request.Currency is not null) item.Currency = request.Currency.ToUpperInvariant(); if (request.ExpiresAt.HasValue) item.ExpiresAtUtc = request.ExpiresAt.Value; if (request.Status is not null) item.Status = request.Status; item.UpdatedAtUtc = Now; await db.SaveChangesAsync(ct); return Map(item);
    }
    public async Task DeleteOpportunityAsync(Guid actorId, Guid businessId, Guid opportunityId, CancellationToken ct) { await RequirePermissionAsync(actorId, businessId, BusinessPermission.RespondToEnquiries, ct); var item = await db.BusinessOpportunities.SingleOrDefaultAsync(x => x.Id == opportunityId && x.BusinessId == businessId, ct) ?? throw ApiException.NotFound("OPPORTUNITY_NOT_FOUND", "The opportunity was not found."); db.BusinessOpportunities.Remove(item); await db.SaveChangesAsync(ct); }

    public async Task<OpportunityPageResponse> SearchOpportunitiesAsync(Guid? viewerId, string? query, string? category, bool includeExpired, int page, int pageSize, CancellationToken ct)
    {
        var now = Now; var q = db.BusinessOpportunities.AsNoTracking().Where(x => x.Status == "open" && (includeExpired || x.ExpiresAtUtc > now)); if (!string.IsNullOrWhiteSpace(query)) q = q.Where(x => x.Title.Contains(query) || x.Description.Contains(query)); if (!string.IsNullOrWhiteSpace(category)) q = q.Where(x => x.Category == category); var total = await q.CountAsync(ct); var size = Math.Clamp(pageSize, 1, 100); var items = await q.OrderByDescending(x => x.CreatedAtUtc).Skip(Math.Max(0, page - 1) * size).Take(size).Select(MapExpression(now)).ToListAsync(ct); return new OpportunityPageResponse(items, total, page, size);
    }
    public async Task<OpportunityResponse> GetOpportunityAsync(Guid opportunityId, Guid? viewerId, CancellationToken ct) { var item = await db.BusinessOpportunities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == opportunityId, ct) ?? throw ApiException.NotFound("OPPORTUNITY_NOT_FOUND", "The opportunity was not found."); if (item.Status != "open" || item.ExpiresAtUtc <= Now) throw ApiException.NotFound("OPPORTUNITY_EXPIRED", "The opportunity is no longer available."); return Map(item); }
    public async Task<EnquiryEntryResponse> StartOpportunityEnquiryAsync(Guid actorId, Guid opportunityId, CancellationToken ct) { var item = await db.BusinessOpportunities.AsNoTracking().SingleOrDefaultAsync(x => x.Id == opportunityId && x.Status == "open" && x.ExpiresAtUtc > Now, ct) ?? throw ApiException.NotFound("OPPORTUNITY_NOT_FOUND", "The opportunity is no longer available."); if (item.BusinessId == actorId || await RoleAsync(actorId, item.BusinessId, ct) is not null) throw ApiException.Forbidden("TEAM_ENQUIRY_FORBIDDEN", "Business team members cannot enquire on their own opportunity."); await RecordAnalyticsEventAsync(item.BusinessId, actorId, new RecordAnalyticsEventRequest { EventType = "opportunity.enquiry_started", SubjectType = "opportunity", SubjectId = item.Id }, ct); return new EnquiryEntryResponse(item.Id, item.BusinessId, "opportunity", $"Enquiry about: {item.Title}"); }

    public async Task RecordAnalyticsEventAsync(Guid businessId, Guid? actorId, RecordAnalyticsEventRequest request, CancellationToken ct) { await BusinessAsync(businessId, ct); db.BusinessAnalyticsEvents.Add(new BusinessAnalyticsEvent { Id = Guid.NewGuid(), BusinessId = businessId, ActorUserId = actorId, EventType = request.EventType.Trim(), SubjectType = request.SubjectType, SubjectId = request.SubjectId, MetadataJson = request.MetadataJson, CreatedAtUtc = Now }); await db.SaveChangesAsync(ct); }

    public async Task<AnalyticsDashboardResponse> GetAnalyticsAsync(Guid actorId, Guid businessId, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        await RequirePermissionAsync(actorId, businessId, BusinessPermission.ViewActivity, ct); if (to <= from || to - from > TimeSpan.FromDays(366)) throw ApiException.BadRequest("ANALYTICS_RANGE_INVALID", "Use a positive date range of at most 366 days."); var events = await db.BusinessAnalyticsEvents.AsNoTracking().Where(x => x.BusinessId == businessId && x.CreatedAtUtc >= from && x.CreatedAtUtc < to).Select(x => x.EventType).ToListAsync(ct); var reviews = await db.BusinessReviews.AsNoTracking().Where(x => x.BusinessId == businessId && x.Status == ReviewStatuses.Published && x.CreatedAtUtc >= from && x.CreatedAtUtc < to).ToListAsync(ct); var metrics = events.GroupBy(x => x).OrderByDescending(x => x.Count()).Select(x => new AnalyticsMetricResponse(x.Key, x.Count())).ToList(); return new AnalyticsDashboardResponse(businessId, from, to, events.Count, metrics, events.Count(x => x == "profile.view"), events.Count(x => x.Contains("enquiry", StringComparison.OrdinalIgnoreCase)), reviews.Count, reviews.Count == 0 ? 0 : reviews.Average(x => (decimal)x.Rating));
    }

    public async Task<GrowthSummaryResponse> GetGrowthSummaryAsync(Guid? viewerId, Guid businessId, DateTimeOffset? from, DateTimeOffset? to, CancellationToken ct)
    {
        var role = viewerId.HasValue ? await RoleAsync(viewerId.Value, businessId, ct) : null; if (await BusinessAsync(businessId, ct) is { Visibility: BusinessVisibility.Private } && !BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile)) throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found."); var end = to ?? Now; var start = from ?? end.AddDays(-30); var events = await db.BusinessAnalyticsEvents.AsNoTracking().Where(x => x.BusinessId == businessId && x.CreatedAtUtc >= start && x.CreatedAtUtc < end).Select(x => x.EventType).ToListAsync(ct); var reviews = await db.BusinessReviews.AsNoTracking().Where(x => x.BusinessId == businessId && x.Status == ReviewStatuses.Published).ToListAsync(ct); return new GrowthSummaryResponse(businessId, reviews.Count == 0 ? 0 : reviews.Average(x => (decimal)x.Rating), reviews.Count, await db.BusinessMilestones.CountAsync(x => x.BusinessId == businessId && (x.Visibility == BusinessVisibility.Public || BusinessAccessControl.Allows(role, BusinessPermission.ViewPrivateProfile)), ct), await db.BusinessOpportunities.CountAsync(x => x.BusinessId == businessId && x.Status == "open" && x.ExpiresAtUtc > Now, ct), events.Count(x => x == "profile.view"), events.Count(x => x.Contains("enquiry", StringComparison.OrdinalIgnoreCase)), start, end);
    }

    private async Task<ReviewResponse> ReviewResponseAsync(BusinessReview r, CancellationToken ct) { var name = await db.UserProfiles.AsNoTracking().Where(x => x.UserId == r.ReviewerUserId).Select(x => x.Name).SingleOrDefaultAsync(ct); return new ReviewResponse(r.Id, r.BusinessId, r.ReviewerUserId, name, r.Rating, r.Comment, r.Status, r.OwnerResponse, r.OwnerRespondedAtUtc, r.CreatedAtUtc); }
    private static MilestoneResponse Map(BusinessMilestone x) => new(x.Id, x.BusinessId, x.Title, x.Description, x.AchievedAtUtc, x.IsSelfReported, x.Visibility, x.CreatedAtUtc);
    private OpportunityResponse Map(BusinessOpportunity x) => new(x.Id, x.BusinessId, x.CreatedByUserId, x.Title, x.Description, x.Category, x.Budget, x.Currency, x.ExpiresAtUtc, x.Status, x.ExpiresAtUtc <= Now || x.Status != "open", x.CreatedAtUtc);
    private static System.Linq.Expressions.Expression<Func<BusinessOpportunity, OpportunityResponse>> MapExpression(DateTimeOffset now) => x => new OpportunityResponse(x.Id, x.BusinessId, x.CreatedByUserId, x.Title, x.Description, x.Category, x.Budget, x.Currency, x.ExpiresAtUtc, x.Status, x.ExpiresAtUtc <= now || x.Status != "open", x.CreatedAtUtc);
}
