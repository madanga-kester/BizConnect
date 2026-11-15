using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BizConnect.Application.Configuration;
using BizConnect.Infrastructure.Persistence;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BizConnect.Infrastructure.Security;

public sealed record IssuedAccessToken(string Token, DateTimeOffset ExpiresAt);

public interface IAccessTokenIssuer
{
    IssuedAccessToken Issue(BizConnectUser user, Guid sessionId);
}

public sealed class AccessTokenIssuer(IOptions<JwtOptions> options, TimeProvider timeProvider) : IAccessTokenIssuer
{
    private readonly JwtOptions _options = options.Value;

    public IssuedAccessToken Issue(BizConnectUser user, Guid sessionId)
    {
        var now = timeProvider.GetUtcNow();
        var expires = now.AddMinutes(_options.AccessTokenMinutes);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("sid", sessionId.ToString()),
            new("email_verified", user.EmailConfirmed ? "true" : "false"),
            new("phone_verified", user.PhoneNumberConfirmed ? "true" : "false")
        };
        var token = new JwtSecurityToken(_options.Issuer, _options.Audience, claims,
            notBefore: now.UtcDateTime, expires: expires.UtcDateTime, signingCredentials: credentials);
        return new IssuedAccessToken(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

public static class OpaqueTokenSecurity
{
    public static string CreateRefreshToken() => Base64UrlEncoder.Encode(RandomNumberGenerator.GetBytes(64));

    public static string Hash(string token, string pepper)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(token)));
    }

    public static bool VerifyHash(string token, string expectedHexHash, string pepper)
    {
        var actual = Convert.FromHexString(Hash(token, pepper));
        var expected = Convert.FromHexString(expectedHexHash);
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    public static string CreateSixDigitCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
}
