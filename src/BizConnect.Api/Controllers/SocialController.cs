using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizConnect.Api.Controllers;

[ApiController, Authorize, Route("api/v1")]
public sealed class SocialController(SocialService social) : ControllerBase
{
    [HttpGet("feed/for-you")] public async Task<ActionResult<CursorPage<PostDto>>> ForYou([FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default) => Ok(await social.Feed(Actor(), false, cursor, limit, ct));
    [HttpGet("feed/following")] public async Task<ActionResult<CursorPage<PostDto>>> Following([FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default) => Ok(await social.Feed(Actor(), true, cursor, limit, ct));
    [HttpPost("posts")] public async Task<ActionResult<PostDto>> CreatePost(CreatePostRequest request, CancellationToken ct) { var post = await social.CreatePost(Actor(), request, ct); return CreatedAtAction(nameof(GetPost), new { postId = post.Id }, post); }
    [HttpGet("posts")] public async Task<ActionResult<CursorPage<PostDto>>> MyPosts([FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default) => Ok(await social.UserPosts(Actor(), Actor(), cursor, limit, ct));
    [HttpGet("posts/{postId:guid}")] public async Task<ActionResult<PostDto>> GetPost(Guid postId, CancellationToken ct) => Ok(await social.GetPost(Actor(), postId, ct));
    [HttpPatch("posts/{postId:guid}")] public async Task<ActionResult<PostDto>> UpdatePost(Guid postId, UpdatePostRequest request, CancellationToken ct) => Ok(await social.UpdatePost(Actor(), postId, request, ct));
    [HttpDelete("posts/{postId:guid}")] public async Task<IActionResult> DeletePost(Guid postId, CancellationToken ct) { await social.DeletePost(Actor(), postId, ct); return NoContent(); }
    [HttpGet("users/{userId:guid}/posts")] public async Task<ActionResult<CursorPage<PostDto>>> UserPosts(Guid userId, [FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default) => Ok(await social.UserPosts(Actor(), userId, cursor, limit, ct));
    [HttpGet("businesses/{businessId:guid}/posts")] public async Task<ActionResult<CursorPage<PostDto>>> BusinessPosts(Guid businessId, [FromQuery] string? cursor, [FromQuery] int limit = 20, CancellationToken ct = default) => Ok(await social.BusinessPosts(Actor(), businessId, cursor, limit, ct));
    [HttpPost("posts/{postId:guid}/likes")] public async Task<IActionResult> Like(Guid postId, CancellationToken ct) { await social.Like(Actor(), postId, ct); return NoContent(); }
    [HttpDelete("posts/{postId:guid}/likes")] public async Task<IActionResult> Unlike(Guid postId, CancellationToken ct) { await social.Unlike(Actor(), postId, ct); return NoContent(); }
    [HttpGet("posts/{postId:guid}/likes")] public async Task<ActionResult<CursorPage<LikeDto>>> Likes(Guid postId, [FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default) => Ok(await social.Likes(Actor(), postId, cursor, limit, ct));
    [HttpPost("posts/{postId:guid}/comments")] public async Task<ActionResult<CommentDto>> Comment(Guid postId, CommentRequest request, CancellationToken ct) { var comment = await social.AddComment(Actor(), postId, request, null, ct); return CreatedAtAction(nameof(Comments), new { postId }, comment); }
    [HttpGet("posts/{postId:guid}/comments")] public async Task<ActionResult<CursorPage<CommentDto>>> Comments(Guid postId, [FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default) => Ok(await social.GetComments(Actor(), postId, null, cursor, limit, ct));
    [HttpPost("comments/{commentId:guid}/replies")] public async Task<ActionResult<CommentDto>> Reply(Guid commentId, CommentRequest request, CancellationToken ct)
    {
        var postId = await social.GetPostForComment(Actor(), commentId, ct); var reply = await social.AddComment(Actor(), postId, request, commentId, ct); return CreatedAtAction(nameof(Replies), new { commentId }, reply);
    }
    [HttpGet("comments/{commentId:guid}/replies")] public async Task<ActionResult<CursorPage<CommentDto>>> Replies(Guid commentId, [FromQuery] string? cursor, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        var postId = await social.GetPostForComment(Actor(), commentId, ct); _ = postId; return Ok(await social.GetReplies(Actor(), commentId, cursor, limit, ct));
    }
    [HttpPatch("comments/{commentId:guid}")] public async Task<ActionResult<CommentDto>> UpdateComment(Guid commentId, CommentRequest request, CancellationToken ct) => Ok(await social.UpdateComment(Actor(), commentId, request, ct));
    [HttpDelete("comments/{commentId:guid}")] public async Task<IActionResult> DeleteComment(Guid commentId, CancellationToken ct) { await social.DeleteComment(Actor(), commentId, ct); return NoContent(); }
    [HttpPost("posts/{postId:guid}/polls")] public async Task<ActionResult<PollDto>> CreatePoll(Guid postId, CreatePollRequest request, CancellationToken ct) { var p = await social.CreatePoll(Actor(), postId, request, ct); return CreatedAtAction(nameof(GetPoll), new { pollId = p.Id }, p); }
    [HttpGet("polls/{pollId:guid}")] public async Task<ActionResult<PollDto>> GetPoll(Guid pollId, CancellationToken ct) => Ok(await social.GetPoll(Actor(), pollId, ct));
    [HttpGet("polls/{pollId:guid}/results")] public async Task<ActionResult<PollDto>> Results(Guid pollId, CancellationToken ct) => Ok(await social.Results(Actor(), pollId, ct));
    [HttpPost("polls/{pollId:guid}/votes")] public async Task<ActionResult<PollDto>> Vote(Guid pollId, VoteRequest request, CancellationToken ct) => Ok(await social.Vote(Actor(), pollId, request.OptionId, ct));
    private Guid Actor() { var raw = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier); if (!Guid.TryParse(raw, out var id)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity."); return id; }
}
public sealed record VoteRequest(Guid OptionId);
