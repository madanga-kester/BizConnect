using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizConnect.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
public sealed class UsersController(IUserService users, INotificationService notifications) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserProfileResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileResponse>> GetMe(CancellationToken cancellationToken) =>
        Ok(await users.GetMeAsync(CurrentUserId(), cancellationToken));

    [HttpPatch("me")]
    [Authorize]
    [ProducesResponseType<UserProfileResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileResponse>> UpdateMe(ProfileUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await users.UpdateMeAsync(CurrentUserId(), request, cancellationToken));

    [HttpGet("{userId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<UserProfileResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileResponse>> GetProfile(Guid userId, CancellationToken cancellationToken)
    {
        Guid? viewerId = null;
        var subject = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(subject, out var authenticatedUserId)) viewerId = authenticatedUserId;
        return Ok(await users.GetPublicProfileAsync(userId, viewerId, cancellationToken));
    }

    [HttpGet("me/preferences")]
    [Authorize]
    [ProducesResponseType<UserPreferencesResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserPreferencesResponse>> GetPreferences(CancellationToken cancellationToken) =>
        Ok(await users.GetPreferencesAsync(CurrentUserId(), cancellationToken));

    [HttpPatch("me/preferences")]
    [Authorize]
    [ProducesResponseType<UserPreferencesResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UserPreferencesResponse>> UpdatePreferences(UserPreferencesUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await users.UpdatePreferencesAsync(CurrentUserId(), request, cancellationToken));

    [HttpGet("me/notification-preferences")]
    [Authorize]
    [ProducesResponseType<NotificationPreferencesResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationPreferencesResponse>> GetNotificationPreferences(CancellationToken cancellationToken) =>
        Ok(await notifications.GetPreferencesAsync(CurrentUserId(), cancellationToken));

    [HttpPatch("me/notification-preferences")]
    [Authorize]
    [ProducesResponseType<NotificationPreferencesResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationPreferencesResponse>> UpdateNotificationPreferences(NotificationPreferencesUpdateRequest request, CancellationToken cancellationToken) =>
        Ok(await notifications.UpdatePreferencesAsync(CurrentUserId(), request, cancellationToken));

    [HttpGet("me/devices")]
    [Authorize]
    [ProducesResponseType<IReadOnlyList<UserDeviceResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UserDeviceResponse>>> GetDevices(CancellationToken cancellationToken) =>
        Ok(await users.GetDevicesAsync(CurrentUserId(), cancellationToken));

    [HttpPost("me/devices")]
    [Authorize]
    [ProducesResponseType<UserDeviceResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<UserDeviceResponse>> RegisterDevice(RegisterUserDeviceRequest request, CancellationToken cancellationToken)
    {
        var device = await users.RegisterDeviceAsync(CurrentUserId(), request, cancellationToken);
        return Created($"/api/v1/users/me/devices/{device.Id}", device);
    }

    [HttpDelete("me/devices/{deviceId:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveDevice(Guid deviceId, CancellationToken cancellationToken)
    {
        await users.RemoveDeviceAsync(CurrentUserId(), deviceId, cancellationToken);
        return NoContent();
    }

    private Guid CurrentUserId()
    {
        var value = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(value, out var id)) throw ApiException.Unauthorized("INVALID_ACCESS_TOKEN", "The access token has no valid user identity.");
        return id;
    }
}
