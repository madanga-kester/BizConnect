using System.Data;
using System.Text.RegularExpressions;
using Mabiz.Application.Configuration;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Domain.Accounts;
using Mabiz.Infrastructure.Persistence;
using Mabiz.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Mabiz.Infrastructure.Services;

public sealed class AuthService(
    UserManager<MabizUser> userManager,
    AppDbContext db,
    IAccessTokenIssuer accessTokens,
    IVerificationCodeSender codeSender,
    IOptions<AuthOptions> authOptions,
    TimeProvider timeProvider,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly AuthOptions _options = authOptions.Value;

    public async Task<UserProfileResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : NormalizePhone(request.Phone);
        if (email is null && phone is null)
            throw ApiException.BadRequest("CONTACT_REQUIRED", "Provide an email address or phone number.");
        if (phone is not null && !Regex.IsMatch(phone, "^\\+[1-9][0-9]{7,14}$"))
            throw ApiException.BadRequest("INVALID_PHONE", "Phone number must be a valid international or Kenyan number.");

        var username = request.Username.Trim();
        var usernameNormalized = NormalizeUsername(username);
        if (await db.UserProfiles.AnyAsync(x => x.UsernameNormalized == usernameNormalized, cancellationToken))
            throw ApiException.Conflict("USERNAME_TAKEN", "That username is already in use.");
        if (email is not null && await userManager.FindByEmailAsync(email) is not null)
            throw ApiException.Conflict("EMAIL_TAKEN", "An account with that email address already exists.");
        if (phone is not null && await userManager.Users.AnyAsync(x => x.PhoneNumber == phone, cancellationToken))
            throw ApiException.Conflict("PHONE_TAKEN", "An account with that phone number already exists.");

        var now = timeProvider.GetUtcNow();
        var user = new MabizUser
        {
            Id = Guid.NewGuid(),
            UserName = "account_" + Guid.NewGuid().ToString("N"),
            Email = email,
            PhoneNumber = phone,
            EmailConfirmed = false,
            PhoneNumberConfirmed = false,
            IsActive = true,
            CreatedAtUtc = now,
            LockoutEnabled = true
        };

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            await transaction.RollbackAsync(cancellationToken);
            ThrowIdentityErrors(created, "Registration could not be completed.");
        }

        db.UserProfiles.Add(new UserProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Username = username,
            UsernameNormalized = usernameNormalized,
            Name = request.Name.Trim(),
            Bio = string.Empty,
            Avatar = request.Avatar,
            County = request.County.Trim(),
            Town = request.Town.Trim(),
            Interests = request.Interests.Select(x => x.Trim()).Where(x => x.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        });
        db.UserPreferences.Add(new UserPreferences { UserId = user.Id, UpdatedAtUtc = now });
        db.UserNotificationPreferences.Add(new UserNotificationPreferences { UserId = user.Id, UpdatedAtUtc = now });
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogInformation(ex, "Registration constraint conflict for account {UserId}", user.Id);
            throw ApiException.Conflict("ACCOUNT_CONFLICT", "The email, phone number, or username is already registered.");
        }

        return await ToProfileAsync(user, includePrivateContact: true, cancellationToken);
    }

    public async Task<AuthSessionResponse> LoginAsync(LoginRequest request, string? userAgent, CancellationToken cancellationToken)
    {
        var user = await FindUserByIdentifierAsync(request.Identifier, cancellationToken);
        if (user is null || !user.IsActive)
            throw ApiException.Unauthorized("INVALID_CREDENTIALS", "The identifier or password is incorrect.");
        if (await userManager.IsLockedOutAsync(user))
            throw ApiException.Unauthorized("ACCOUNT_LOCKED", "Sign-in is temporarily unavailable. Try again later.");

        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            throw ApiException.Unauthorized("INVALID_CREDENTIALS", "The identifier or password is incorrect.");
        }
        await userManager.ResetAccessFailedCountAsync(user);
        user.LastSignedInAtUtc = timeProvider.GetUtcNow();
        await userManager.UpdateAsync(user);
        return await CreateSessionAsync(user, userAgent, cancellationToken);
    }

    public async Task<AuthSessionResponse> RefreshAsync(string rawRefreshToken, string? userAgent, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            throw ApiException.Unauthorized("REFRESH_TOKEN_REQUIRED", "A refresh token is required.");
        var tokenHash = OpaqueTokenSecurity.Hash(rawRefreshToken, _options.ChallengePepper);
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var token = await db.RefreshTokens.SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);
        if (token is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw ApiException.Unauthorized("INVALID_REFRESH_TOKEN", "The refresh token is invalid or expired.");
        }

        var session = await db.UserSessions.SingleAsync(x => x.Id == token.SessionId, cancellationToken);
        var now = timeProvider.GetUtcNow();
        if (token.ConsumedAtUtc is not null || token.RevokedAtUtc is not null)
        {
            if (token.ConsumedAtUtc is not null && session.RevokedAtUtc is null)
            {
                session.RevokedAtUtc = now;
                foreach (var outstanding in await db.RefreshTokens.Where(x => x.SessionId == session.Id && x.RevokedAtUtc == null).ToListAsync(cancellationToken))
                    outstanding.RevokedAtUtc = now;
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                logger.LogWarning("Refresh-token reuse detected; revoked session {SessionId}", session.Id);
            }
            else
            {
                await transaction.RollbackAsync(cancellationToken);
            }
            throw ApiException.Unauthorized("REFRESH_TOKEN_REUSE", "The refresh session was revoked. Sign in again.");
        }
        if (token.ExpiresAtUtc <= now || session.ExpiresAtUtc <= now || session.RevokedAtUtc is not null)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw ApiException.Unauthorized("INVALID_REFRESH_TOKEN", "The refresh token is invalid or expired.");
        }

        var user = await userManager.FindByIdAsync(session.UserId.ToString());
        if (user is null || !user.IsActive)
        {
            session.RevokedAtUtc = now;
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            throw ApiException.Unauthorized("ACCOUNT_DISABLED", "The account is unavailable.");
        }

        var rawNext = OpaqueTokenSecurity.CreateRefreshToken();
        var next = new RefreshToken
        {
            Id = Guid.NewGuid(), SessionId = session.Id,
            TokenHash = OpaqueTokenSecurity.Hash(rawNext, _options.ChallengePepper),
            CreatedAtUtc = now, ExpiresAtUtc = now.AddDays(_options.RefreshTokenDays)
        };
        token.ConsumedAtUtc = now;
        token.ReplacedByTokenId = next.Id;
        session.LastSeenAtUtc = now;
        session.ExpiresAtUtc = next.ExpiresAtUtc;
        if (!string.IsNullOrWhiteSpace(userAgent)) session.UserAgent = Truncate(userAgent, 512);
        db.RefreshTokens.Add(next);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return await CreateAuthResponseAsync(user, session.Id, rawNext, cancellationToken);
    }

    public async Task LogoutAsync(Guid? sessionId, string? rawRefreshToken, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        Guid? targetSession = sessionId;
        if (!string.IsNullOrWhiteSpace(rawRefreshToken))
        {
            var hash = OpaqueTokenSecurity.Hash(rawRefreshToken, _options.ChallengePepper);
            targetSession ??= await db.RefreshTokens.Where(x => x.TokenHash == hash).Select(x => (Guid?)x.SessionId).SingleOrDefaultAsync(cancellationToken);
        }
        if (targetSession is null) return;
        var session = await db.UserSessions.SingleOrDefaultAsync(x => x.Id == targetSession.Value, cancellationToken);
        if (session is null) return;
        session.RevokedAtUtc ??= now;
        foreach (var token in await db.RefreshTokens.Where(x => x.SessionId == session.Id && x.RevokedAtUtc == null).ToListAsync(cancellationToken))
            token.RevokedAtUtc = now;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<VerificationChallengeResponse> RequestVerificationCodeAsync(VerificationCodeRequest request, CancellationToken cancellationToken)
    {
        EnsureDeliveryConfigured();
        var user = await FindUserByIdentifierAsync(request.Identifier, cancellationToken);
        if (user is null) throw ApiException.NotFound("ACCOUNT_NOT_FOUND", "No account was found for this identifier.");
        var now = timeProvider.GetUtcNow();
        var expires = now.AddMinutes(_options.ChallengeExpiryMinutes);
        var code = OpaqueTokenSecurity.CreateSixDigitCode();
        if (IsPhoneIdentifier(request.Identifier))
        {
            if (string.IsNullOrWhiteSpace(user.PhoneNumber)) throw ApiException.Unprocessable("PHONE_NOT_AVAILABLE", "This account has no phone number to verify.");
            var challenge = new PhoneVerificationChallenge
            {
                Id = Guid.NewGuid(), UserId = user.Id, PhoneNumber = user.PhoneNumber, Purpose = request.Purpose,
                CodeHash = OpaqueTokenSecurity.Hash(code, _options.ChallengePepper), CreatedAtUtc = now, ExpiresAtUtc = expires
            };
            await codeSender.SendAsync("phone", user.PhoneNumber, request.Purpose, code, cancellationToken);
            db.PhoneVerificationChallenges.Add(challenge);
            await db.SaveChangesAsync(cancellationToken);
            return new VerificationChallengeResponse(challenge.Id.ToString(), expires);
        }
        if (string.IsNullOrWhiteSpace(user.Email)) throw ApiException.Unprocessable("EMAIL_NOT_AVAILABLE", "This account has no email address to verify.");
        var emailChallenge = new EmailVerificationChallenge
        {
            Id = Guid.NewGuid(), UserId = user.Id, Email = user.Email, Purpose = request.Purpose,
            CodeHash = OpaqueTokenSecurity.Hash(code, _options.ChallengePepper), CreatedAtUtc = now, ExpiresAtUtc = expires
        };
        await codeSender.SendAsync("email", user.Email, request.Purpose, code, cancellationToken);
        db.EmailVerificationChallenges.Add(emailChallenge);
        await db.SaveChangesAsync(cancellationToken);
        return new VerificationChallengeResponse(emailChallenge.Id.ToString(), expires);
    }

    public async Task<VerificationResultResponse> VerifyVerificationCodeAsync(VerificationCodeConfirmRequest request, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var emailChallenge = await db.EmailVerificationChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId, cancellationToken);
        if (emailChallenge is not null)
        {
            if (!IsChallengeValid(emailChallenge.ExpiresAtUtc, emailChallenge.ConsumedAtUtc, emailChallenge.FailedAttempts))
                throw ApiException.Unprocessable("CHALLENGE_EXPIRED", "The verification challenge is expired, used, or locked.");
            if (!OpaqueTokenSecurity.VerifyHash(request.Code, emailChallenge.CodeHash, _options.ChallengePepper))
            {
                emailChallenge.FailedAttempts++;
                await db.SaveChangesAsync(cancellationToken);
                throw ApiException.Unprocessable("INVALID_CODE", "The verification code is invalid.");
            }
            var user = await userManager.FindByIdAsync(emailChallenge.UserId.ToString()) ?? throw ApiException.NotFound("ACCOUNT_NOT_FOUND", "The account no longer exists.");
            if (!string.Equals(user.Email, emailChallenge.Email, StringComparison.OrdinalIgnoreCase))
                throw ApiException.Conflict("CONTACT_CHANGED", "The email address changed after this challenge was created.");
            emailChallenge.ConsumedAtUtc = now;
            user.EmailConfirmed = true;
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded) ThrowIdentityErrors(result, "Email verification could not be completed.");
            await db.SaveChangesAsync(cancellationToken);
            return new VerificationResultResponse(true);
        }

        var phoneChallenge = await db.PhoneVerificationChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId, cancellationToken);
        if (phoneChallenge is null) throw ApiException.NotFound("CHALLENGE_NOT_FOUND", "The verification challenge was not found.");
        if (!IsChallengeValid(phoneChallenge.ExpiresAtUtc, phoneChallenge.ConsumedAtUtc, phoneChallenge.FailedAttempts))
            throw ApiException.Unprocessable("CHALLENGE_EXPIRED", "The verification challenge is expired, used, or locked.");
        if (!OpaqueTokenSecurity.VerifyHash(request.Code, phoneChallenge.CodeHash, _options.ChallengePepper))
        {
            phoneChallenge.FailedAttempts++;
            await db.SaveChangesAsync(cancellationToken);
            throw ApiException.Unprocessable("INVALID_CODE", "The verification code is invalid.");
        }
        var phoneUser = await userManager.FindByIdAsync(phoneChallenge.UserId.ToString()) ?? throw ApiException.NotFound("ACCOUNT_NOT_FOUND", "The account no longer exists.");
        if (phoneUser.PhoneNumber != phoneChallenge.PhoneNumber)
            throw ApiException.Conflict("CONTACT_CHANGED", "The phone number changed after this challenge was created.");
        phoneChallenge.ConsumedAtUtc = now;
        phoneUser.PhoneNumberConfirmed = true;
        var phoneResult = await userManager.UpdateAsync(phoneUser);
        if (!phoneResult.Succeeded) ThrowIdentityErrors(phoneResult, "Phone verification could not be completed.");
        await db.SaveChangesAsync(cancellationToken);
        return new VerificationResultResponse(true);
    }

    public async Task<PasswordResetAcceptedResponse> RequestPasswordResetAsync(PasswordResetRequestDto request, CancellationToken cancellationToken)
    {
        EnsureDeliveryConfigured();
        var user = await FindUserByIdentifierAsync(request.Identifier, cancellationToken);
        if (user is null) return new PasswordResetAcceptedResponse(true);
        var channel = IsPhoneIdentifier(request.Identifier) ? "phone" : "email";
        var destination = channel == "phone" ? user.PhoneNumber : user.Email;
        if (string.IsNullOrWhiteSpace(destination)) return new PasswordResetAcceptedResponse(true);
        var now = timeProvider.GetUtcNow();
        var recentRequests = await db.PasswordResetRequests.CountAsync(x => x.UserId == user.Id && x.CreatedAtUtc > now.AddHours(-1), cancellationToken);
        if (recentRequests >= MaximumPasswordResetRequestsPerHour) return new PasswordResetAcceptedResponse(true);
        await db.PasswordResetRequests.Where(x => x.UserId == user.Id && x.ConsumedAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ConsumedAtUtc, (DateTimeOffset?)now), cancellationToken);
        var code = OpaqueTokenSecurity.CreateSixDigitCode();
        var reset = new PasswordResetRequest
        {
            Id = Guid.NewGuid(), UserId = user.Id,
            CodeHash = OpaqueTokenSecurity.Hash(code, _options.ChallengePepper),
            CreatedAtUtc = now, ExpiresAtUtc = now.AddMinutes(_options.ChallengeExpiryMinutes)
        };
        db.PasswordResetRequests.Add(reset);
        await db.SaveChangesAsync(cancellationToken);
        try
        {
            await codeSender.SendAsync(channel, destination, "password-reset", code, cancellationToken);
        }
        catch
        {
            reset.ConsumedAtUtc = timeProvider.GetUtcNow();
            await db.SaveChangesAsync(cancellationToken);
            throw;
        }
        return new PasswordResetAcceptedResponse(true);
    }

        public async Task<PasswordResetCodeVerifiedResponse> VerifyPasswordResetCodeAsync(VerifyPasswordResetCodeRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        await RequireValidPasswordResetAsync(transaction, request.Identifier, request.Code, cancellationToken);
        return new PasswordResetCodeVerifiedResponse(true);
    }

    public async Task CompletePasswordResetAsync(CompletePasswordResetRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var (user, reset) = await RequireValidPasswordResetAsync(transaction, request.Identifier, request.Code, cancellationToken);
        if (await IsPasswordReusedAsync(user, request.NewPassword, cancellationToken))
            throw ApiException.Unprocessable("PASSWORD_REUSED", $"Choose a password you have not used among your last {PasswordHistoryDepth} passwords.");
        var previousPasswordHash = user.PasswordHash;
        var identityToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var result = await userManager.ResetPasswordAsync(user, identityToken, request.NewPassword);
        if (!result.Succeeded) ThrowIdentityErrors(result, "The new password does not meet the account security policy.");
        await RecordPasswordHistoryAsync(user.Id, previousPasswordHash, timeProvider.GetUtcNow(), cancellationToken);

        var now = timeProvider.GetUtcNow();
        reset.ConsumedAtUtc = now;
        foreach (var session in await db.UserSessions.Where(x => x.UserId == user.Id && x.RevokedAtUtc == null).ToListAsync(cancellationToken))
        {
            session.RevokedAtUtc = now;
            foreach (var token in await db.RefreshTokens.Where(x => x.SessionId == session.Id && x.RevokedAtUtc == null).ToListAsync(cancellationToken))
                token.RevokedAtUtc = now;
        }
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<AuthSessionResponse> CreateSessionAsync(MabizUser user, string? userAgent, CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();
        var rawRefresh = OpaqueTokenSecurity.CreateRefreshToken();
        var session = new UserSession
        {
            Id = Guid.NewGuid(), UserId = user.Id, CreatedAtUtc = now, LastSeenAtUtc = now,
            ExpiresAtUtc = now.AddDays(_options.RefreshTokenDays), UserAgent = Truncate(userAgent, 512)
        };
        db.UserSessions.Add(session);
        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(), SessionId = session.Id,
            TokenHash = OpaqueTokenSecurity.Hash(rawRefresh, _options.ChallengePepper),
            CreatedAtUtc = now, ExpiresAtUtc = session.ExpiresAtUtc
        });
        await db.SaveChangesAsync(cancellationToken);
        return await CreateAuthResponseAsync(user, session.Id, rawRefresh, cancellationToken);
    }

    private async Task<AuthSessionResponse> CreateAuthResponseAsync(MabizUser user, Guid sessionId, string rawRefresh, CancellationToken cancellationToken)
    {
        var issued = accessTokens.Issue(user, sessionId);
        return new AuthSessionResponse(await ToProfileAsync(user, includePrivateContact: true, cancellationToken), issued.Token, rawRefresh, issued.ExpiresAt);
    }

    private async Task<UserProfileResponse> ToProfileAsync(MabizUser user, bool includePrivateContact, CancellationToken cancellationToken)
    {
        var profile = await db.UserProfiles.AsNoTracking().SingleAsync(x => x.UserId == user.Id, cancellationToken);
        var followers = await db.UserFollows.CountAsync(x => x.FollowedUserId == user.Id, cancellationToken);
        var following = await db.UserFollows.CountAsync(x => x.FollowerUserId == user.Id, cancellationToken);
        return new UserProfileResponse(user.Id.ToString(), profile.Username, profile.Name,
            includePrivateContact ? user.Email : null, includePrivateContact ? user.PhoneNumber : null,
            profile.Bio, profile.Avatar, profile.County, profile.Town, profile.Neighbourhood,
            profile.Interests, profile.PrivateProfile, followers, following, user.EmailConfirmed, user.PhoneNumberConfirmed);
    }

        private async Task<(MabizUser User, PasswordResetRequest Reset)> RequireValidPasswordResetAsync(
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction, string identifier, string code, CancellationToken cancellationToken)
    {
        var user = await FindUserByIdentifierAsync(identifier, cancellationToken);
        PasswordResetRequest? reset = null;
        if (user is not null)
        {
            var userId = user.Id;
            reset = await db.PasswordResetRequests
                .Where(x => x.UserId == userId && x.ConsumedAtUtc == null)
                .OrderByDescending(x => x.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);
        }
        if (user is null || reset is null || !IsChallengeValid(reset.ExpiresAtUtc, reset.ConsumedAtUtc, reset.FailedAttempts))
            throw ApiException.Unprocessable("INVALID_RESET_CODE", "The reset code is invalid or has expired.");
        if (!OpaqueTokenSecurity.VerifyHash(code, reset.CodeHash, _options.ChallengePepper))
        {
            reset.FailedAttempts++;
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            throw ApiException.Unprocessable("INVALID_RESET_CODE", "The reset code is invalid or has expired.");
        }
        return (user, reset);
    }
    private const int MaximumPasswordResetRequestsPerHour = 5;
        private const int PasswordHistoryDepth = 5;

    private async Task<bool> IsPasswordReusedAsync(MabizUser user, string newPassword, CancellationToken cancellationToken)
    {
        if (await userManager.CheckPasswordAsync(user, newPassword)) return true;
        var recentHashes = await db.PasswordHistoryEntries.AsNoTracking()
            .Where(x => x.UserId == user.Id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(PasswordHistoryDepth - 1)
            .Select(x => x.PasswordHash)
            .ToListAsync(cancellationToken);
        return recentHashes.Any(hash => userManager.PasswordHasher.VerifyHashedPassword(user, hash, newPassword) != PasswordVerificationResult.Failed);
    }

    private async Task RecordPasswordHistoryAsync(Guid userId, string? previousPasswordHash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(previousPasswordHash)) return;
        var stale = await db.PasswordHistoryEntries
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip(PasswordHistoryDepth - 2)
            .ToListAsync(cancellationToken);
        db.PasswordHistoryEntries.RemoveRange(stale);
        db.PasswordHistoryEntries.Add(new PasswordHistoryEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PasswordHash = previousPasswordHash,
            CreatedAtUtc = now
        });
    }
    private async Task<MabizUser?> FindUserByIdentifierAsync(string identifier, CancellationToken cancellationToken)
    {
        var value = identifier.Trim();
        if (value.Contains('@', StringComparison.Ordinal)) return await userManager.FindByEmailAsync(value);
        if (Regex.IsMatch(value, "^[+0-9 ()-]+$"))
        {
            var phone = NormalizePhone(value);
            var byPhone = await userManager.Users.SingleOrDefaultAsync(x => x.PhoneNumber == phone, cancellationToken);
            if (byPhone is not null) return byPhone;
        }
        var normalized = NormalizeUsername(value);
        return await (from profile in db.UserProfiles
                      join account in userManager.Users on profile.UserId equals account.Id
                      where profile.UsernameNormalized == normalized
                      select account).SingleOrDefaultAsync(cancellationToken);
    }

    private static bool IsPhoneIdentifier(string identifier) => !identifier.Contains('@', StringComparison.Ordinal) && Regex.IsMatch(identifier.Trim(), "^[+0-9 ()-]+$");
    private bool IsChallengeValid(DateTimeOffset expiresAt, DateTimeOffset? consumedAt, int failedAttempts) =>
        consumedAt is null && expiresAt > timeProvider.GetUtcNow() && failedAttempts < _options.MaximumChallengeAttempts;
    private void EnsureDeliveryConfigured()
    {
        if (!codeSender.IsConfigured)
            throw ApiException.Unavailable("VERIFICATION_DELIVERY_UNAVAILABLE", "Email/SMS delivery is not configured for this environment.");
    }

    private static string NormalizeUsername(string username) => username.Trim().ToUpperInvariant();

    private static string NormalizePhone(string value)
    {
        var trimmed = value.Trim();
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        if (trimmed.StartsWith("+", StringComparison.Ordinal)) return "+" + digits;
        if (trimmed.StartsWith("00", StringComparison.Ordinal)) return "+" + digits[2..];
        if (digits.StartsWith('0')) return "+254" + digits[1..];
        return "+" + digits;
    }

    private static string? Truncate(string? value, int maxLength) => string.IsNullOrWhiteSpace(value) ? null : value[..Math.Min(value.Length, maxLength)];

    private static void ThrowIdentityErrors(IdentityResult result, string fallback)
    {
        var errors = result.Errors.ToList();
        var duplicates = errors.Any(x => x.Code.Contains("Duplicate", StringComparison.OrdinalIgnoreCase));
        var message = string.Join(" ", errors.Select(x => x.Description));
        if (duplicates) throw ApiException.Conflict("IDENTITY_CONFLICT", "An account with one of those identifiers already exists.");
        throw ApiException.BadRequest("IDENTITY_VALIDATION_FAILED", string.IsNullOrWhiteSpace(message) ? fallback : message);
    }
}
