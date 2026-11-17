namespace Mabiz.Domain.Accounts;

public sealed class UserProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UsernameNormalized { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string County { get; set; } = string.Empty;
    public string Town { get; set; } = string.Empty;
    public string? Neighbourhood { get; set; }
    public List<string> Interests { get; set; } = [];
    public bool PrivateProfile { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class UserPreferences
{
    public Guid UserId { get; set; }
    public string Locale { get; set; } = "en";
    public string TimeZone { get; set; } = "Africa/Nairobi";
    public string Theme { get; set; } = "system";
    public bool ShareLocation { get; set; }
    public bool ReducedDataUsage { get; set; }
    public bool AutoplayVideos { get; set; } = true;
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class UserNotificationPreferences
{
    public Guid UserId { get; set; }
    public bool InAppEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public bool PushEnabled { get; set; }
    public bool NewFollowers { get; set; } = true;
    public bool Messages { get; set; } = true;
    public bool Likes { get; set; } = true;
    public bool Comments { get; set; } = true;
    public bool BusinessTeamActivity { get; set; } = true;
    public bool BusinessUpdates { get; set; } = true;
    public DateTimeOffset UpdatedAtUtc { get; set; }
}

public sealed class UserSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset LastSeenAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public string? DeviceLabel { get; set; }
    public string? UserAgent { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public sealed class RefreshToken
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
    public Guid? ReplacedByTokenId { get; set; }
}

public sealed class EmailVerificationChallenge
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public int FailedAttempts { get; set; }
}

public sealed class PhoneVerificationChallenge
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Purpose { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public int FailedAttempts { get; set; }
}

public sealed class PasswordResetRequest
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string CodeHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? ConsumedAtUtc { get; set; }
    public int FailedAttempts { get; set; }
}

public sealed class UserDevice
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string DeviceIdentifier { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    /// <summary>Data-Protection protected Expo push token. Never return or log this value.</summary>
    public string? PushTokenEncrypted { get; set; }
    /// <summary>SHA-256 token fingerprint used only to prevent the same Expo token being assigned twice.</summary>
    public string? PushTokenHash { get; set; }
    public DateTimeOffset? PushTokenUpdatedAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset LastSeenAtUtc { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
}
