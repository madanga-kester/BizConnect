using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mabiz.Api.Controllers;

[ApiController, Authorize, Route("api/v1")]
public sealed class SocialTaggingController(SocialTaggingService tagging) : ControllerBase
{
    [HttpPost("posts/{postId:guid}/tags")] public async Task<ActionResult<IReadOnlyList<TaggedUserDto>>> Tag(Guid postId, TagUserRequest request, CancellationToken ct) => Ok(await tagging.TagUser(Actor(), postId, request.UserId, ct));
    [HttpDelete("posts/{postId:guid}/tags/{userId:guid}")] public async Task<IActionResult> Untag(Guid postId, Guid userId, CancellationToken ct) { await tagging.Untag(Actor(), postId, userId, ct); return NoContent(); }
    [HttpGet("posts/{postId:guid}/tags")] public async Task<ActionResult<IReadOnlyList<TaggedUserDto>>> Tags(Guid postId, CancellationToken ct) => Ok(await tagging.List(Actor(), postId, ct));
    private Guid Actor() { var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); if (!Guid.TryParse(raw, out var id)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity."); return id; }
}