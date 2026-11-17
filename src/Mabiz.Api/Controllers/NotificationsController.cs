using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mabiz.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public sealed class NotificationsController(INotificationService notifications) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<NotificationPageResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationPageResponse>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false, CancellationToken cancellationToken = default) =>
        Ok(await notifications.ListAsync(CurrentUserId(), page, pageSize, unreadOnly, cancellationToken));

    [HttpGet("unread-count")]
    [ProducesResponseType<NotificationUnreadCountResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationUnreadCountResponse>> UnreadCount(CancellationToken cancellationToken) =>
        Ok(await notifications.GetUnreadCountAsync(CurrentUserId(), cancellationToken));

    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await notifications.MarkAllReadAsync(CurrentUserId(), cancellationToken);
        return NoContent();
    }

    [HttpPost("{notificationId:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkRead(Guid notificationId, CancellationToken cancellationToken)
    {
        await notifications.MarkReadAsync(CurrentUserId(), notificationId, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{notificationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Dismiss(Guid notificationId, CancellationToken cancellationToken)
    {
        await notifications.DismissAsync(CurrentUserId(), notificationId, cancellationToken);
        return NoContent();
    }

    private Guid CurrentUserId()
    {
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return userId;
    }
}
