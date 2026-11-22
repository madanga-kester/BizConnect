using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mabiz.Api.Controllers;

[ApiController, Authorize, Route("api/v1")]
public sealed class SocialStoryController(SocialStoryService stories) : ControllerBase
{
    [HttpPost("stories")] public async Task<ActionResult<StoryDto>> Create(CreateStoryRequest request, CancellationToken ct) { var story = await stories.Create(Actor(), request, ct); return CreatedAtAction(nameof(GetStory), new { storyId = story.Id }, story); }
    [HttpGet("stories")] public async Task<ActionResult<CursorPage<StoryDto>>> Feed([FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default) => Ok(await stories.Feed(Actor(), cursor, limit, ct));
    [HttpGet("users/{userId:guid}/stories")] public async Task<ActionResult<CursorPage<StoryDto>>> UserStories(Guid userId, [FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default) => Ok(await stories.UserStories(Actor(), userId, cursor, limit, ct));
    [HttpGet("stories/{storyId:guid}")] public async Task<ActionResult<StoryDto>> GetStory(Guid storyId, CancellationToken ct) => Ok(await stories.Get(Actor(), storyId, ct));
    [HttpDelete("stories/{storyId:guid}")] public async Task<IActionResult> Delete(Guid storyId, CancellationToken ct) { await stories.Delete(Actor(), storyId, ct); return NoContent(); }
    [HttpPost("stories/{storyId:guid}/replies")] public async Task<ActionResult<StoryReplyDto>> Reply(Guid storyId, StoryReplyRequest request, CancellationToken ct) => Ok(await stories.Reply(Actor(), storyId, request.Text, ct));
    [HttpGet("stories/{storyId:guid}/replies")] public async Task<ActionResult<CursorPage<StoryReplyDto>>> Replies(Guid storyId, [FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default) => Ok(await stories.Replies(Actor(), storyId, cursor, limit, ct));
    private Guid Actor() { var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); if (!Guid.TryParse(raw, out var id)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity."); return id; }
}