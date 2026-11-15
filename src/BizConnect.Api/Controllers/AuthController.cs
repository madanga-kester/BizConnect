using System.Security.Claims;
using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Api.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BizConnect.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController(IAuthService auth, AuthCookieService cookies) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType<UserProfileResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<UserProfileResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        var result = await auth.RegisterAsync(request, cancellationToken);
        return Created($"/api/v1/users/{result.Id}", result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<AuthSessionResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthSessionResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        var result = await auth.LoginAsync(request, Request.Headers.UserAgent.ToString(), cancellationToken);
        return Ok(ForClient(result));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType<AuthSessionResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AuthSessionResponse>> Refresh(RefreshRequest request, CancellationToken cancellationToken)
    {
        cookies.ValidateCsrfForCookieRequest(HttpContext);
        var refreshToken = cookies.GetRefreshCookie(Request) ?? request.RefreshToken;
        var result = await auth.RefreshAsync(refreshToken ?? string.Empty, Request.Headers.UserAgent.ToString(), cancellationToken);
        return Ok(ForClient(result));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(LogoutRequest request, CancellationToken cancellationToken)
    {
        cookies.ValidateCsrfForCookieRequest(HttpContext);
        Guid? sessionId = null;
        var sessionClaim = User.FindFirstValue("sid");
        if (Guid.TryParse(sessionClaim, out var parsed)) sessionId = parsed;
        await auth.LogoutAsync(sessionId, cookies.GetRefreshCookie(Request) ?? request.RefreshToken, cancellationToken);
        cookies.Clear(HttpContext);
        return NoContent();
    }

    [HttpGet("csrf")]
    [AllowAnonymous]
    [ProducesResponseType<CsrfResponse>(StatusCodes.Status200OK)]
    public ActionResult<CsrfResponse> GetCsrfToken() => Ok(new CsrfResponse(cookies.IssueCsrfToken(HttpContext)));

    [HttpPost("verification-codes")]
    [AllowAnonymous]
    [ProducesResponseType<VerificationChallengeResponse>(StatusCodes.Status202Accepted)]
    public async Task<ActionResult<VerificationChallengeResponse>> RequestVerificationCode(VerificationCodeRequest request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        var result = await auth.RequestVerificationCodeAsync(request, cancellationToken);
        return Accepted(result);
    }

    [HttpPost("verification-codes/verify")]
    [AllowAnonymous]
    [ProducesResponseType<VerificationResultResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<VerificationResultResponse>> VerifyCode(VerificationCodeConfirmRequest request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        return Ok(await auth.VerifyVerificationCodeAsync(request, cancellationToken));
    }

    [HttpPost("password-resets")]
    [AllowAnonymous]
    [ProducesResponseType<PasswordResetAcceptedResponse>(StatusCodes.Status202Accepted)]
    public async Task<ActionResult<PasswordResetAcceptedResponse>> RequestPasswordReset(PasswordResetRequestDto request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        return Accepted(await auth.RequestPasswordResetAsync(request, cancellationToken));
    }

    [HttpPost("password-resets/complete")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CompletePasswordReset(CompletePasswordResetRequest request, CancellationToken cancellationToken)
    {
        cookies.EnsureAllowedOrigin(Request);
        await auth.CompletePasswordResetAsync(request, cancellationToken);
        return NoContent();
    }

    private AuthSessionResponse ForClient(AuthSessionResponse result)
    {
        if (!cookies.HasBrowserOrigin(Request)) return result;
        cookies.SetRefreshCookie(HttpContext, result.RefreshToken!, result.ExpiresAt);
        return result with { RefreshToken = null };
    }

    public sealed record RefreshRequest(string? RefreshToken);
    public sealed record LogoutRequest(string? RefreshToken);
    public sealed record CsrfResponse(string CsrfToken);
}
