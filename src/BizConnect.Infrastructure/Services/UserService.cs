using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Accounts;
using BizConnect.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace BizConnect.Infrastructure.Services;

public sealed class UserService(UserManager<BizConnectUser> userManager, AppDbContext db, TimeProvider timeProvider, IDataProtectionProvider protectionProvider) : IUserService
{
    private readonly IDataProtector _pushTokenProtector = protectionProvider.CreateProtector("BizConnect.Device.ExpoPushToken.v1");
    public async Task<UserProfileResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("PROFILE_NOT_FOUND", "The user profile was not found.");
        return await MapAsync(user, profile, includeContact: true, cancellationToken);
    }

    public async Task<UserProfileResponse> GetPublicProfileAsync(Guid userId, Guid? viewerId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        if (!user.IsActive) throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        var profile = await db.UserProfiles.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("PROFILE_NOT_FOUND", "The user profile was not found.");
        if (profile.PrivateProfile && viewerId != userId)
            throw ApiException.NotFound("PROFILE_NOT_FOUND", "The user profile was not found.");
        return await MapAsync(user, profile, includeContact: false, cancellationToken);
    }

    public async Task<UserProfileResponse> UpdateMeAsync(Guid userId, ProfileUpdateRequest request, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()) ?? throw ApiException.NotFound("USER_NOT_FOUND", "The user was not found.");
        var profile = await db.UserProfiles.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("PROFILE_NOT_FOUND", "The user profile was not found.");

        if (request.Email is not null && !string.Equals(request.Email.Trim(), user.Email, StringComparison.OrdinalIgnoreCase))
            throw ApiException.Unprocessable("CONTACT_VERIFICATION_REQUIRED", "Changing an email requires a dedicated verified-contact workflow; it is not enabled in Stage 2.");
        if (request.Phone is not null && !string.Equals(NormalizePhone(request.Phone), user.PhoneNumber, StringComparison.Ordinal))
            throw ApiException.Unprocessable("CONTACT_VERIFICATION_REQUIRED", "Changing a phone number requires a dedicated verified-contact workflow; it is not enabled in Stage 2.");

        if (request.Username is not null)
        {
            var normalized = request.Username.Trim().ToUpperInvariant();
            var inUse = await db.UserProfiles.AnyAsync(x => x.UserId != userId && x.UsernameNormalized == normalized, cancellationToken);
            if (inUse) throw ApiException.Conflict("USERNAME_TAKEN", "That username is already in use.");
            profile.Username = request.Username.Trim();
            profile.UsernameNormalized = normalized;
        }
        if (request.Name is not null) profile.Name = request.Name.Trim();
        if (request.Bio is not null) profile.Bio = request.Bio.Trim();
        if (request.Avatar is not null) profile.Avatar = request.Avatar;
        if (request.County is not null) profile.County = request.County.Trim();
        if (request.Town is not null) profile.Town = request.Town.Trim();
        if (request.Neighbourhood is not null) profile.Neighbourhood = request.Neighbourhood.Trim();
        if (request.Interests is not null)
            profile.Interests = request.Interests.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        if (request.PrivateProfile.HasValue) profile.PrivateProfile = request.PrivateProfile.Value;
        profile.UpdatedAtUtc = timeProvider.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
        return await MapAsync(user, profile, includeContact: true, cancellationToken);
    }

    public async Task<UserPreferencesResponse> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var preferences = await db.UserPreferences.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("PREFERENCES_NOT_FOUND", "The user preferences were not found.");
        return Map(preferences);
    }

    public async Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UserPreferencesUpdateRequest request, CancellationToken cancellationToken)
    {
        var preferences = await db.UserPreferences.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("PREFERENCES_NOT_FOUND", "The user preferences were not found.");
        if (request.Locale is not null) preferences.Locale = request.Locale.Trim();
        if (request.TimeZone is not null) preferences.TimeZone = request.TimeZone.Trim();
        if (request.Theme is not null) preferences.Theme = request.Theme;
        if (request.ShareLocation.HasValue) preferences.ShareLocation = request.ShareLocation.Value;
        if (request.ReducedDataUsage.HasValue) preferences.ReducedDataUsage = request.ReducedDataUsage.Value;
        if (request.AutoplayVideos.HasValue) preferences.AutoplayVideos = request.AutoplayVideos.Value;
        preferences.UpdatedAtUtc = timeProvider.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
        return Map(preferences);
    }

    public async Task<IReadOnlyList<UserDeviceResponse>> GetDevicesAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await db.UserDevices.AsNoTracking()
            .Where(x => x.UserId == userId && x.RevokedAtUtc == null)
            .OrderByDescending(x => x.LastSeenAtUtc)
            .Select(x => new UserDeviceResponse(x.Id.ToString(), x.DeviceIdentifier, x.Platform, x.DeviceName, x.PushTokenHash != null, x.CreatedAtUtc, x.LastSeenAtUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<UserDeviceResponse> RegisterDeviceAsync(Guid userId, RegisterUserDeviceRequest request, CancellationToken cancellationToken)
    {
        var identifier = request.DeviceIdentifier.Trim();
        var platform = request.Platform.ToLowerInvariant();
        var pushToken = string.IsNullOrWhiteSpace(request.PushToken) ? null : request.PushToken.Trim();
        var now = timeProvider.GetUtcNow();
        var tokenHash = pushToken is null ? null : Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(pushToken)));
        if (tokenHash is not null)
        {
            await db.UserDevices.Where(x => x.UserId != userId && x.PushTokenHash == tokenHash)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.PushTokenEncrypted, (string?)null)
                    .SetProperty(x => x.PushTokenHash, (string?)null).SetProperty(x => x.PushTokenUpdatedAtUtc, now), cancellationToken);
        }
        var device = await db.UserDevices.SingleOrDefaultAsync(x => x.UserId == userId && x.DeviceIdentifier == identifier, cancellationToken);
        if (device is null)
        {
            device = new UserDevice { Id = Guid.NewGuid(), UserId = userId, DeviceIdentifier = identifier, Platform = platform, DeviceName = request.DeviceName?.Trim(), CreatedAtUtc = now, LastSeenAtUtc = now };
            db.UserDevices.Add(device);
        }
        else
        {
            device.Platform = platform;
            device.DeviceName = request.DeviceName?.Trim();
            device.LastSeenAtUtc = now;
            device.RevokedAtUtc = null;
        }
        if (pushToken is not null)
        {
            device.PushTokenEncrypted = _pushTokenProtector.Protect(pushToken);
            device.PushTokenHash = tokenHash;
            device.PushTokenUpdatedAtUtc = now;
        }
        await db.SaveChangesAsync(cancellationToken);
        return new UserDeviceResponse(device.Id.ToString(), device.DeviceIdentifier, device.Platform, device.DeviceName, device.PushTokenHash is not null, device.CreatedAtUtc, device.LastSeenAtUtc);
    }

    public async Task RemoveDeviceAsync(Guid userId, Guid deviceId, CancellationToken cancellationToken)
    {
        var device = await db.UserDevices.SingleOrDefaultAsync(x => x.Id == deviceId && x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("DEVICE_NOT_FOUND", "The device was not found.");
        device.RevokedAtUtc ??= timeProvider.GetUtcNow();
        device.PushTokenEncrypted = null;
        device.PushTokenHash = null;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<UserProfileResponse> MapAsync(BizConnectUser user, UserProfile profile, bool includeContact, CancellationToken cancellationToken)
    {
        var followers = await db.UserFollows.CountAsync(x => x.FollowedUserId == user.Id, cancellationToken);
        var following = await db.UserFollows.CountAsync(x => x.FollowerUserId == user.Id, cancellationToken);
        return new UserProfileResponse(user.Id.ToString(), profile.Username, profile.Name,
            includeContact ? user.Email : null, includeContact ? user.PhoneNumber : null,
            profile.Bio, profile.Avatar, profile.County, profile.Town, profile.Neighbourhood,
            profile.Interests, profile.PrivateProfile, followers, following, user.EmailConfirmed, user.PhoneNumberConfirmed);
    }

    private static UserPreferencesResponse Map(UserPreferences preferences) => new(
        preferences.Locale, preferences.TimeZone, preferences.Theme, preferences.ShareLocation,
        preferences.ReducedDataUsage, preferences.AutoplayVideos);

    private static string NormalizePhone(string value)
    {
        var trimmed = value.Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        if (trimmed.StartsWith("+", StringComparison.Ordinal)) return "+" + digits;
        if (trimmed.StartsWith("00", StringComparison.Ordinal)) return "+" + digits[2..];
        if (digits.StartsWith('0')) return "+254" + digits[1..];
        return "+" + digits;
    }
}
