using System.Security.Cryptography;
using System.Text;
using BizConnect.Application.Configuration;
using BizConnect.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace BizConnect.Api.Security;

public sealed class AuthCookieService(IConfiguration configuration, IOptions<AuthOptions> authOptions, IWebHostEnvironment environment)
{
    public const string RefreshCookieName = "bizconnect_refresh";
    public const string CsrfCookieName = "bizconnect_csrf";
    public const string CsrfHeaderName = "X-BizConnect-CSRF";
    private readonly string[] _allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    private readonly AuthOptions _options = authOptions.Value;

    public bool HasBrowserOrigin(HttpRequest request) => !string.IsNullOrWhiteSpace(request.Headers.Origin);

    public void EnsureAllowedOrigin(HttpRequest request)
    {
        var origin = request.Headers.Origin.ToString();
        if (string.IsNullOrWhiteSpace(origin)) return;
        if (!_allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            throw ApiException.Forbidden("ORIGIN_NOT_ALLOWED", "This browser origin is not allowed.");
    }

    public string IssueCsrfToken(HttpContext context)
    {
        EnsureAllowedOrigin(context.Request);
        if (!HasBrowserOrigin(context.Request))
            throw ApiException.BadRequest("BROWSER_ORIGIN_REQUIRED", "A verified browser origin is required.");
        var token = Microsoft.AspNetCore.WebUtilities.WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var options = CookieOptions(context.Request, "/");
        options.HttpOnly = false;
        options.MaxAge = TimeSpan.FromHours(8);
        context.Response.Cookies.Append(CsrfCookieName, token, options);
        context.Response.Headers[CsrfHeaderName] = token;
        return token;
    }

    public void SetRefreshCookie(HttpContext context, string rawToken, DateTimeOffset expiresAt)
    {
        EnsureAllowedOrigin(context.Request);
        if (!HasBrowserOrigin(context.Request)) return;
        var options = CookieOptions(context.Request, "/api/v1/auth");
        options.HttpOnly = true;
        options.MaxAge = expiresAt - DateTimeOffset.UtcNow;
        context.Response.Cookies.Append(RefreshCookieName, rawToken, options);
        IssueCsrfToken(context);
    }

    public string? GetRefreshCookie(HttpRequest request) => request.Cookies.TryGetValue(RefreshCookieName, out var value) ? value : null;

    public void ValidateCsrfForCookieRequest(HttpContext context)
    {
        EnsureAllowedOrigin(context.Request);
        if (GetRefreshCookie(context.Request) is null) return;
        if (!HasBrowserOrigin(context.Request) ||
            !context.Request.Cookies.TryGetValue(CsrfCookieName, out var cookieToken) ||
            !context.Request.Headers.TryGetValue(CsrfHeaderName, out var headerValues))
            throw ApiException.Forbidden("CSRF_VALIDATION_FAILED", "A valid CSRF token is required for browser session requests.");
        var headerToken = headerValues.ToString();
        var a = Encoding.UTF8.GetBytes(cookieToken);
        var b = Encoding.UTF8.GetBytes(headerToken);
        if (a.Length != b.Length || !CryptographicOperations.FixedTimeEquals(a, b))
            throw ApiException.Forbidden("CSRF_VALIDATION_FAILED", "A valid CSRF token is required for browser session requests.");
    }

    public void Clear(HttpContext context)
    {
        var refreshOptions = CookieOptions(context.Request, "/api/v1/auth");
        refreshOptions.MaxAge = TimeSpan.Zero;
        context.Response.Cookies.Delete(RefreshCookieName, refreshOptions);
        var csrfOptions = CookieOptions(context.Request, "/");
        csrfOptions.MaxAge = TimeSpan.Zero;
        csrfOptions.HttpOnly = false;
        context.Response.Cookies.Delete(CsrfCookieName, csrfOptions);
    }

    private CookieOptions CookieOptions(HttpRequest request, string path)
    {
        var sameSite = _options.CookieSameSite switch
        {
            "Strict" => SameSiteMode.Strict,
            "None" => SameSiteMode.None,
            _ => SameSiteMode.Lax
        };
        return new CookieOptions
        {
            Path = path,
            Domain = string.IsNullOrWhiteSpace(_options.CookieDomain) ? null : _options.CookieDomain,
            Secure = _options.RequireSecureCookies || request.IsHttps || !environment.IsDevelopment(),
            SameSite = sameSite,
            IsEssential = true
        };
    }
}
