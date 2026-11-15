using System.ComponentModel.DataAnnotations;

namespace BizConnect.Application.Contracts;

public sealed record RegisterRequest
{
    [Required, StringLength(80, MinimumLength = 2)] public string Name { get; init; } = string.Empty;
    [Required, RegularExpression("^[a-zA-Z0-9_.]{3,30}$")] public string Username { get; init; } = string.Empty;
    [EmailAddress, StringLength(254)] public string? Email { get; init; }
    [StringLength(32)] public string? Phone { get; init; }
    [Required, StringLength(128, MinimumLength = 12)] public string Password { get; init; } = string.Empty;
    [Required, StringLength(100)] public string County { get; init; } = string.Empty;
    [Required, StringLength(100)] public string Town { get; init; } = string.Empty;
    [MaxLength(30)] public List<string> Interests { get; init; } = [];
    [Url, StringLength(2048)] public string? Avatar { get; init; }
}

public sealed record LoginRequest
{
    [Required, StringLength(254)] public string Identifier { get; init; } = string.Empty;
    [Required, StringLength(128)] public string Password { get; init; } = string.Empty;
}

public sealed record AuthSessionResponse(UserProfileResponse User, string AccessToken, string? RefreshToken, DateTimeOffset ExpiresAt);

public sealed record UserProfileResponse(
    string Id,
    string Username,
    string Name,
    string? Email,
    string? Phone,
    string Bio,
    string? Avatar,
    string County,
    string Town,
    string? Neighbourhood,
    IReadOnlyList<string> Interests,
    bool PrivateProfile,
    int Followers,
    int Following,
    bool EmailVerified,
    bool PhoneVerified);

public sealed record ProfileUpdateRequest
{
    [StringLength(80, MinimumLength = 2)] public string? Name { get; init; }
    [RegularExpression("^[a-zA-Z0-9_.]{3,30}$")] public string? Username { get; init; }
    [EmailAddress, StringLength(254)] public string? Email { get; init; }
    [StringLength(32)] public string? Phone { get; init; }
    [StringLength(500)] public string? Bio { get; init; }
    [Url, StringLength(2048)] public string? Avatar { get; init; }
    [StringLength(100)] public string? County { get; init; }
    [StringLength(100)] public string? Town { get; init; }
    [StringLength(100)] public string? Neighbourhood { get; init; }
    [MaxLength(30)] public List<string>? Interests { get; init; }
    public bool? PrivateProfile { get; init; }
}

public sealed record VerificationCodeRequest
{
    [Required, StringLength(254)] public string Identifier { get; init; } = string.Empty;
    [Required, RegularExpression("^(registration|login)$")] public string Purpose { get; init; } = "registration";
}

public sealed record VerificationChallengeResponse(string ChallengeId, DateTimeOffset ExpiresAt);

public sealed record VerificationCodeConfirmRequest
{
    [Required] public Guid ChallengeId { get; init; }
    [Required, RegularExpression("^[0-9]{6}$")] public string Code { get; init; } = string.Empty;
}

public sealed record VerificationResultResponse(bool Verified, string? VerificationToken = null);
public sealed record PasswordResetRequestDto([Required, StringLength(254)] string Identifier);
public sealed record PasswordResetAcceptedResponse(bool Accepted);
public sealed record CompletePasswordResetRequest
{
    [Required, StringLength(256)] public string ResetToken { get; init; } = string.Empty;
    [Required, StringLength(128, MinimumLength = 12)] public string NewPassword { get; init; } = string.Empty;
}

public sealed record UserPreferencesResponse(string Locale, string TimeZone, string Theme, bool ShareLocation, bool ReducedDataUsage, bool AutoplayVideos);
public sealed record UserPreferencesUpdateRequest
{
    [StringLength(10)] public string? Locale { get; init; }
    [StringLength(80)] public string? TimeZone { get; init; }
    [RegularExpression("^(light|dark|system)$")] public string? Theme { get; init; }
    public bool? ShareLocation { get; init; }
    public bool? ReducedDataUsage { get; init; }
    public bool? AutoplayVideos { get; init; }
}

public sealed record UserDeviceResponse(string Id, string DeviceIdentifier, string Platform, string? DeviceName, bool HasPushToken, DateTimeOffset CreatedAt, DateTimeOffset LastSeenAt);
public sealed record RegisterUserDeviceRequest
{
    [Required, StringLength(160, MinimumLength = 4)] public string DeviceIdentifier { get; init; } = string.Empty;
    [Required, RegularExpression("^(ios|android|web|other)$")] public string Platform { get; init; } = string.Empty;
    [StringLength(100)] public string? DeviceName { get; init; }
    [StringLength(512), RegularExpression("^(Exponent|Expo)PushToken\\[[A-Za-z0-9_-]{8,300}\\]$")]
    public string? PushToken { get; init; }
}
