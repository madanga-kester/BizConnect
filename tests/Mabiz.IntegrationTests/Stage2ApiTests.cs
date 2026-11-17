using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Mabiz.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.IntegrationTests;

[Collection(PostgresApiCollection.Name)]
public sealed class Stage2ApiTests(PostgresApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task RegistrationAndLogin_PersistPasswordHashAndIssueTokens()
    {
        using var client = factory.CreateClient();
        var registration = await RegisterAsync(client, "alice");
        Assert.Equal(HttpStatusCode.Created, registration.StatusCode);
        var registered = await registration.Content.ReadFromJsonAsync<UserResult>(JsonOptions);
        Assert.NotNull(registered);
        Assert.False(registered.EmailVerified);
        var userId = Guid.Parse(registered.Id);

        using var scope = factory.Services.CreateScope();
        var manager = scope.ServiceProvider.GetRequiredService<UserManager<MabizUser>>();
        var user = await manager.FindByIdAsync(userId.ToString());
        Assert.NotNull(user);
        Assert.NotEqual("P@ssword12345", user.PasswordHash);
        Assert.True(await manager.CheckPasswordAsync(user, "P@ssword12345"));

        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = "alice@example.test", password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = await login.Content.ReadFromJsonAsync<AuthResult>(JsonOptions);
        Assert.NotNull(session);
        Assert.False(string.IsNullOrWhiteSpace(session.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(session.RefreshToken));
        Assert.Equal(userId.ToString(), session.User.Id);
        Assert.True(session.ExpiresAt > DateTimeOffset.UtcNow);

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userSessionIds = db.UserSessions.AsNoTracking().Where(item => item.UserId == userId).Select(item => item.Id);
        var storedTokens = await db.RefreshTokens.AsNoTracking().Where(token => userSessionIds.Contains(token.SessionId)).ToListAsync();
        Assert.Single(storedTokens);
        Assert.NotEqual(session.RefreshToken, storedTokens[0].TokenHash);
    }

    [Fact]
    public async Task Refresh_RotatesTokenAndReuseRevokesSession()
    {
        using var client = factory.CreateClient();
        var registration = await RegisterAsync(client, "bob");
        var bob = await registration.Content.ReadFromJsonAsync<UserResult>(JsonOptions);
        Assert.NotNull(bob);
        var first = await LoginAsync(client, "bob");

        var refresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = first.RefreshToken });
        Assert.Equal(HttpStatusCode.OK, refresh.StatusCode);
        var second = await refresh.Content.ReadFromJsonAsync<AuthResult>(JsonOptions);
        Assert.NotNull(second);
        Assert.NotEqual(first.RefreshToken, second.RefreshToken);

        var reused = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = first.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, reused.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", second.AccessToken);
        var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var bobSessions = await db.UserSessions.AsNoTracking().Where(session => session.UserId == Guid.Parse(bob.Id)).ToListAsync();
        Assert.NotEmpty(bobSessions);
        Assert.All(bobSessions, session => Assert.NotNull(session.RevokedAtUtc));
    }

    [Fact]
    public async Task ProfilePreferencesAndDeviceEndpoints_AuthorizeAndPersistPerUser()
    {
        using var client = factory.CreateClient();
        var firstRegistration = await RegisterAsync(client, "carol");
        var firstBody = await firstRegistration.Content.ReadFromJsonAsync<UserResult>(JsonOptions);
        var first = await LoginAsync(client, "carol");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", first.AccessToken);

        var me = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var preferences = await client.PatchAsJsonAsync("/api/v1/users/me/preferences", new { locale = "sw", theme = "dark", shareLocation = true });
        Assert.Equal(HttpStatusCode.OK, preferences.StatusCode);
        var savedPreferences = await preferences.Content.ReadFromJsonAsync<PreferencesResult>(JsonOptions);
        Assert.Equal("sw", savedPreferences!.Locale);
        Assert.True(savedPreferences.ShareLocation);

        var device = await client.PostAsJsonAsync("/api/v1/users/me/devices", new { deviceIdentifier = "device-carol-0001", platform = "android", deviceName = "Test phone" });
        Assert.Equal(HttpStatusCode.Created, device.StatusCode);
        var deviceBody = await device.Content.ReadFromJsonAsync<DeviceResult>(JsonOptions);
        Assert.NotNull(deviceBody);
        var list = await client.GetFromJsonAsync<List<DeviceResult>>("/api/v1/users/me/devices", JsonOptions);
        Assert.Single(list!);

        var secondRegistration = await RegisterAsync(client, "david");
        var secondBody = await secondRegistration.Content.ReadFromJsonAsync<UserResult>(JsonOptions);
        using var secondClient = factory.CreateClient();
        var second = await LoginAsync(secondClient, "david");
        secondClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", second.AccessToken);
        var privateUpdate = await secondClient.PatchAsJsonAsync("/api/v1/users/me", new { privateProfile = true });
        Assert.Equal(HttpStatusCode.OK, privateUpdate.StatusCode);

        var publicSecond = await client.GetAsync($"/api/v1/users/{secondBody!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, publicSecond.StatusCode);
        Assert.Equal(firstBody!.Id, first.User.Id);
    }

    [Fact]
    public async Task Logout_RevokesRefreshAndAccessSession()
    {
        using var client = factory.CreateClient();
        await RegisterAsync(client, "erin");
        var session = await LoginAsync(client, "erin");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.AccessToken);
        var logout = await client.PostAsJsonAsync("/api/v1/auth/logout", new { });
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        var after = await client.GetAsync("/api/v1/users/me");
        Assert.Equal(HttpStatusCode.Unauthorized, after.StatusCode);
        var refresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = session.RefreshToken });
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
    }

    [Fact]
    public async Task BrowserRefreshCookie_HidesTokenAndRequiresMatchingCsrfHeader()
    {
        using var setup = factory.CreateClient();
        await RegisterAsync(setup, "frank");
        using var browser = factory.CreateClient();
        browser.DefaultRequestHeaders.Add("Origin", "http://localhost:8081");

        var login = await browser.PostAsJsonAsync("/api/v1/auth/login", new { identifier = "frank@example.test", password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var loginBody = await login.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal(JsonValueKind.Null, loginBody.GetProperty("refreshToken").ValueKind);
        var setCookies = login.Headers.GetValues("Set-Cookie").ToArray();
        var refreshCookie = setCookies.Single(value => value.StartsWith("Mabiz_refresh=", StringComparison.Ordinal)).Split(';')[0];
        var csrfCookie = setCookies.Single(value => value.StartsWith("Mabiz_csrf=", StringComparison.Ordinal)).Split(';')[0];
        var csrfToken = csrfCookie[("Mabiz_csrf=".Length)..];

        using var missingCsrf = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh")
        {
            Content = JsonContent.Create(new { refreshToken = (string?)null })
        };
        missingCsrf.Headers.Add("Cookie", $"{refreshCookie}; {csrfCookie}");
        var blocked = await browser.SendAsync(missingCsrf);
        Assert.Equal(HttpStatusCode.Forbidden, blocked.StatusCode);

        using var validRefresh = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh")
        {
            Content = JsonContent.Create(new { refreshToken = (string?)null })
        };
        validRefresh.Headers.Add("Cookie", $"{refreshCookie}; {csrfCookie}");
        validRefresh.Headers.Add("X-Mabiz-CSRF", csrfToken);
        var refreshed = await browser.SendAsync(validRefresh);
        Assert.Equal(HttpStatusCode.OK, refreshed.StatusCode);
        var refreshedBody = await refreshed.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        Assert.Equal(JsonValueKind.Null, refreshedBody.GetProperty("refreshToken").ValueKind);
    }

    private static async Task<HttpResponseMessage> RegisterAsync(HttpClient client, string username) =>
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            name = username.ToUpperInvariant(), username, email = $"{username}@example.test", phone = (string?)null,
            password = "P@ssword12345", county = "Nairobi", town = "Nairobi", interests = new[] { "Retail" }, avatar = (string?)null
        });

    private static async Task<AuthResult> LoginAsync(HttpClient client, string username)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { identifier = $"{username}@example.test", password = "P@ssword12345" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<AuthResult>(JsonOptions))!;
    }

    private sealed record AuthResult(UserResult User, string AccessToken, string? RefreshToken, DateTimeOffset ExpiresAt);
    private sealed record UserResult(string Id, string Username, string Name, string? Email, string? Phone, string Bio, string County, string Town, bool PrivateProfile, bool EmailVerified);
    private sealed record PreferencesResult(string Locale, string TimeZone, string Theme, bool ShareLocation, bool ReducedDataUsage, bool AutoplayVideos);
    private sealed record DeviceResult(string Id, string DeviceIdentifier, string Platform, string? DeviceName, DateTimeOffset CreatedAt, DateTimeOffset LastSeenAt);
}
