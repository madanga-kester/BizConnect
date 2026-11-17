using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mabiz.Api.Controllers;

[ApiController, Authorize, Route("api/v1")]
public sealed class SocialRelationshipsController(SocialRelationshipService relationships) : ControllerBase
{
    [HttpGet("users/{userId:guid}/follow")] public async Task<ActionResult<FollowStateDto>> UserFollowState(Guid userId, CancellationToken ct) => Ok(await relationships.UserState(Actor(), userId, ct));
    [HttpGet("users/me/followers")] public async Task<ActionResult<FollowListDto>> MyFollowers([FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) => Ok(await relationships.UserList(Actor(), Actor(), true, page, pageSize, ct));
    [HttpGet("users/me/following")] public async Task<ActionResult<FollowListDto>> MyFollowing([FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) => Ok(await relationships.UserList(Actor(), Actor(), false, page, pageSize, ct));
    [HttpPost("users/{userId:guid}/follow")] public async Task<IActionResult> FollowUser(Guid userId, CancellationToken ct) { await relationships.FollowUser(Actor(), userId, ct); return NoContent(); }
    [HttpDelete("users/{userId:guid}/follow")] public async Task<IActionResult> UnfollowUser(Guid userId, CancellationToken ct) { await relationships.UnfollowUser(Actor(), userId, ct); return NoContent(); }
    [HttpGet("users/{userId:guid}/followers")] public async Task<ActionResult<FollowListDto>> Followers(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) => Ok(await relationships.UserList(Actor(), userId, true, page, pageSize, ct));
    [HttpGet("users/{userId:guid}/following")] public async Task<ActionResult<FollowListDto>> Following(Guid userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) => Ok(await relationships.UserList(Actor(), userId, false, page, pageSize, ct));
    [HttpGet("businesses/{businessId:guid}/follow")] public async Task<ActionResult<FollowStateDto>> BusinessFollowState(Guid businessId, CancellationToken ct) => Ok(await relationships.BusinessState(Actor(), businessId, ct));
    [HttpPost("businesses/{businessId:guid}/follow")] public async Task<IActionResult> FollowBusiness(Guid businessId, CancellationToken ct) { await relationships.FollowBusiness(Actor(), businessId, ct); return NoContent(); }
    [HttpDelete("businesses/{businessId:guid}/follow")] public async Task<IActionResult> UnfollowBusiness(Guid businessId, CancellationToken ct) { await relationships.UnfollowBusiness(Actor(), businessId, ct); return NoContent(); }
    [HttpGet("businesses/{businessId:guid}/followers")] public async Task<ActionResult<BusinessFollowListDto>> BusinessFollowers(Guid businessId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) => Ok(await relationships.BusinessFollowers(Actor(), businessId, page, pageSize, ct));
    [HttpGet("moderation/blocks/{userId:guid}")] public async Task<ActionResult<ModerationStateDto>> BlockState(Guid userId, CancellationToken ct) => Ok(new ModerationStateDto(await relationships.BlockState(Actor(), userId, ct)));
    [HttpPost("moderation/blocks/{userId:guid}")] public async Task<IActionResult> Block(Guid userId, CancellationToken ct) { await relationships.Block(Actor(), userId, ct); return NoContent(); }
    [HttpDelete("moderation/blocks/{userId:guid}")] public async Task<IActionResult> Unblock(Guid userId, CancellationToken ct) { await relationships.Unblock(Actor(), userId, ct); return NoContent(); }
    [HttpGet("moderation/hidden-posts/{postId:guid}")] public async Task<ActionResult<ModerationStateDto>> Hidden(Guid postId, CancellationToken ct) => Ok(new ModerationStateDto(await relationships.Hidden(Actor(), postId, ct)));
    [HttpPost("moderation/hidden-posts/{postId:guid}")] public async Task<IActionResult> Hide(Guid postId, CancellationToken ct) { await relationships.Hide(Actor(), postId, ct); return NoContent(); }
    [HttpDelete("moderation/hidden-posts/{postId:guid}")] public async Task<IActionResult> Unhide(Guid postId, CancellationToken ct) { await relationships.Unhide(Actor(), postId, ct); return NoContent(); }
    private Guid Actor() { var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); if (!Guid.TryParse(raw, out var id)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity."); return id; }
}
