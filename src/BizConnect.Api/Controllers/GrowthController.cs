using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizConnect.Api.Controllers;

[ApiController, Route("api/v1")]
public sealed class GrowthController(IGrowthService growth) : ControllerBase
{
    [HttpGet("businesses/{businessId:guid}/milestones"), AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<MilestoneResponse>>> Milestones(Guid businessId, CancellationToken ct) => Ok(await growth.ListMilestonesAsync(businessId, OptionalUserId(), ct));
    [HttpPost("businesses/{businessId:guid}/milestones"), Authorize]
    public async Task<ActionResult<MilestoneResponse>> CreateMilestone(Guid businessId, CreateMilestoneRequest request, CancellationToken ct) => Ok(await growth.CreateMilestoneAsync(CurrentUserId(), businessId, request, ct));
    [HttpPatch("businesses/{businessId:guid}/milestones/{milestoneId:guid}"), Authorize]
    public async Task<ActionResult<MilestoneResponse>> UpdateMilestone(Guid businessId, Guid milestoneId, UpdateMilestoneRequest request, CancellationToken ct) => Ok(await growth.UpdateMilestoneAsync(CurrentUserId(), businessId, milestoneId, request, ct));
    [HttpDelete("businesses/{businessId:guid}/milestones/{milestoneId:guid}"), Authorize]
    public async Task<IActionResult> DeleteMilestone(Guid businessId, Guid milestoneId, CancellationToken ct) { await growth.DeleteMilestoneAsync(CurrentUserId(), businessId, milestoneId, ct); return NoContent(); }

    [HttpGet("opportunities"), AllowAnonymous]
    public async Task<ActionResult<OpportunityPageResponse>> Opportunities([FromQuery] string? q, [FromQuery] string? category, [FromQuery] bool includeExpired = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) => Ok(await growth.SearchOpportunitiesAsync(OptionalUserId(), q, category, includeExpired, page, pageSize, ct));
    [HttpGet("opportunities/{opportunityId:guid}"), AllowAnonymous]
    public async Task<ActionResult<OpportunityResponse>> Opportunity(Guid opportunityId, CancellationToken ct) => Ok(await growth.GetOpportunityAsync(opportunityId, OptionalUserId(), ct));
    [HttpPost("businesses/{businessId:guid}/opportunities"), Authorize]
    public async Task<ActionResult<OpportunityResponse>> CreateOpportunity(Guid businessId, CreateOpportunityRequest request, CancellationToken ct) => Ok(await growth.CreateOpportunityAsync(CurrentUserId(), businessId, request, ct));
    [HttpPatch("businesses/{businessId:guid}/opportunities/{opportunityId:guid}"), Authorize]
    public async Task<ActionResult<OpportunityResponse>> UpdateOpportunity(Guid businessId, Guid opportunityId, UpdateOpportunityRequest request, CancellationToken ct) => Ok(await growth.UpdateOpportunityAsync(CurrentUserId(), businessId, opportunityId, request, ct));
    [HttpDelete("businesses/{businessId:guid}/opportunities/{opportunityId:guid}"), Authorize]
    public async Task<IActionResult> DeleteOpportunity(Guid businessId, Guid opportunityId, CancellationToken ct) { await growth.DeleteOpportunityAsync(CurrentUserId(), businessId, opportunityId, ct); return NoContent(); }
    [HttpPost("opportunities/{opportunityId:guid}/enquiry"), Authorize]
    public async Task<ActionResult<EnquiryEntryResponse>> Enquiry(Guid opportunityId, CancellationToken ct) => Ok(await growth.StartOpportunityEnquiryAsync(CurrentUserId(), opportunityId, ct));

    [HttpPost("businesses/{businessId:guid}/analytics/events"), AllowAnonymous]
    public async Task<IActionResult> AnalyticsEvent(Guid businessId, RecordAnalyticsEventRequest request, CancellationToken ct) { await growth.RecordAnalyticsEventAsync(businessId, OptionalUserId(), request, ct); return Accepted(); }
    [HttpGet("businesses/{businessId:guid}/analytics"), Authorize]
    public async Task<ActionResult<AnalyticsDashboardResponse>> Analytics(Guid businessId, [FromQuery] DateTimeOffset from, [FromQuery] DateTimeOffset to, CancellationToken ct) => Ok(await growth.GetAnalyticsAsync(CurrentUserId(), businessId, from, to, ct));
    [HttpGet("businesses/{businessId:guid}/growth-summary"), AllowAnonymous]
    public async Task<ActionResult<GrowthSummaryResponse>> Summary(Guid businessId, [FromQuery] DateTimeOffset? from, [FromQuery] DateTimeOffset? to, CancellationToken ct) => Ok(await growth.GetGrowthSummaryAsync(OptionalUserId(), businessId, from, to, ct));

    private Guid CurrentUserId() => OptionalUserId() ?? throw ApiException.Unauthorized();
    private Guid? OptionalUserId() { var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); return Guid.TryParse(value, out var id) ? id : null; }
}
