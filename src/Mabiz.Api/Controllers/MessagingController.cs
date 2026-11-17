using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Mabiz.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/conversations")]
public sealed class MessagingController(IMessagingService messaging) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ConversationPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationPageResponse>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await messaging.ListConversationsAsync(CurrentUserId(), page, pageSize, cancellationToken));

    [HttpGet("{conversationId:guid}")]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationResponse>> Get(Guid conversationId, CancellationToken cancellationToken) =>
        Ok(await messaging.GetConversationAsync(CurrentUserId(), conversationId, cancellationToken));

    [HttpPost]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ConversationResponse>> Start(StartConversationRequest request, CancellationToken cancellationToken)
    {
        var conversation = await messaging.StartConversationAsync(CurrentUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { conversationId = Guid.Parse(conversation.Id) }, conversation);
    }

    [HttpGet("{conversationId:guid}/messages")]
    [ProducesResponseType<ConversationMessagePageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<ConversationMessagePageResponse>> GetMessages(Guid conversationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 30, CancellationToken cancellationToken = default) =>
        Ok(await messaging.ListMessagesAsync(CurrentUserId(), conversationId, page, pageSize, cancellationToken));

    [HttpPost("{conversationId:guid}/messages")]
    [EnableRateLimiting("business-write")]
    [ProducesResponseType<ConversationMessageResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ConversationMessageResponse>> Send(Guid conversationId, SendConversationMessageRequest request, CancellationToken cancellationToken)
    {
        var response = await messaging.SendMessageAsync(CurrentUserId(), conversationId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("{conversationId:guid}/delivered")]
    public async Task<IActionResult> Delivered(Guid conversationId, CancellationToken cancellationToken)
    {
        await messaging.MarkDeliveredAsync(CurrentUserId(), conversationId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{conversationId:guid}/read")]
    public async Task<IActionResult> Read(Guid conversationId, CancellationToken cancellationToken)
    {
        await messaging.MarkReadAsync(CurrentUserId(), conversationId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{conversationId:guid}/archive")]
    public async Task<IActionResult> Archive(Guid conversationId, CancellationToken cancellationToken)
    {
        await messaging.ArchiveAsync(CurrentUserId(), conversationId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{conversationId:guid}/block")]
    public async Task<IActionResult> Block(Guid conversationId, CancellationToken cancellationToken)
    {
        await messaging.BlockAsync(CurrentUserId(), conversationId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{conversationId:guid}/block")]
    public async Task<IActionResult> Unblock(Guid conversationId, CancellationToken cancellationToken)
    {
        await messaging.UnblockAsync(CurrentUserId(), conversationId, cancellationToken);
        return NoContent();
    }

    private Guid CurrentUserId()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return userId;
    }
}
