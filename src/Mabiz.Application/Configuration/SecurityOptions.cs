using System.ComponentModel.DataAnnotations;

namespace Mabiz.Application.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    [Required, MinLength(3)] public string Issuer { get; init; } = string.Empty;
    [Required, MinLength(3)] public string Audience { get; init; } = string.Empty;
    [Required, MinLength(32)] public string SigningKey { get; init; } = string.Empty;
    [Range(2, 60)] public int AccessTokenMinutes { get; init; } = 10;
}

public sealed class AuthOptions
{
    public const string SectionName = "Auth";
    [Required, MinLength(32)] public string ChallengePepper { get; init; } = string.Empty;
    [Range(1, 90)] public int RefreshTokenDays { get; init; } = 30;
    [Range(3, 30)] public int ChallengeExpiryMinutes { get; init; } = 10;
    [Range(3, 10)] public int MaximumChallengeAttempts { get; init; } = 5;
    [StringLength(100)] public string? CookieDomain { get; init; }
    [RegularExpression("^(Lax|Strict|None)$")] public string CookieSameSite { get; init; } = "Lax";
    public bool RequireSecureCookies { get; init; } = true;
}
