using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mabiz.Api.Controllers;

[ApiController, Route("api/v1/businesses/{businessId:guid}/reviews")]
public sealed class GrowthReviewsController(IGrowthService growth) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<ReviewPageResponse>> List(Guid businessId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default) => Ok(await growth.ListReviewsAsync(businessId, OptionalUserId(), page, pageSize, ct));
    [HttpPost, Authorize]
    public async Task<ActionResult<ReviewResponse>> Create(Guid businessId, CreateReviewRequest request, CancellationToken ct) => Ok(await growth.CreateReviewAsync(CurrentUserId(), businessId, request, ct));
    [HttpPatch("{reviewId:guid}"), Authorize]
    public async Task<ActionResult<ReviewResponse>> Update(Guid businessId, Guid reviewId, UpdateReviewRequest request, CancellationToken ct) => Ok(await growth.UpdateReviewAsync(CurrentUserId(), businessId, reviewId, request, ct));
    [HttpDelete("{reviewId:guid}"), Authorize]
    public async Task<IActionResult> Delete(Guid businessId, Guid reviewId, CancellationToken ct) { await growth.DeleteReviewAsync(CurrentUserId(), businessId, reviewId, ct); return NoContent(); }
    [HttpPost("{reviewId:guid}/response"), Authorize]
    public async Task<ActionResult<ReviewResponse>> Respond(Guid businessId, Guid reviewId, OwnerResponseRequest request, CancellationToken ct) => Ok(await growth.RespondToReviewAsync(CurrentUserId(), businessId, reviewId, request, ct));
    [HttpPost("{reviewId:guid}/report"), Authorize]
    public async Task<IActionResult> Report(Guid businessId, Guid reviewId, ReportReviewRequest request, CancellationToken ct) { await growth.ReportReviewAsync(CurrentUserId(), businessId, reviewId, request, ct); return NoContent(); }
    private Guid CurrentUserId() => OptionalUserId() ?? throw ApiException.Unauthorized();
    private Guid? OptionalUserId() { var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); return Guid.TryParse(value, out var id) ? id : null; }
}
