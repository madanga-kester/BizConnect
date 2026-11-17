using Mabiz.Application.Contracts;

namespace Mabiz.Application.Services;

public interface IAuthService
{
    Task<UserProfileResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthSessionResponse> LoginAsync(LoginRequest request, string? userAgent, CancellationToken cancellationToken);
    Task<AuthSessionResponse> RefreshAsync(string rawRefreshToken, string? userAgent, CancellationToken cancellationToken);
    Task LogoutAsync(Guid? sessionId, string? rawRefreshToken, CancellationToken cancellationToken);
    Task<VerificationChallengeResponse> RequestVerificationCodeAsync(VerificationCodeRequest request, CancellationToken cancellationToken);
    Task<VerificationResultResponse> VerifyVerificationCodeAsync(VerificationCodeConfirmRequest request, CancellationToken cancellationToken);
    Task<PasswordResetAcceptedResponse> RequestPasswordResetAsync(PasswordResetRequestDto request, CancellationToken cancellationToken);
    Task CompletePasswordResetAsync(CompletePasswordResetRequest request, CancellationToken cancellationToken);
        Task<PasswordResetCodeVerifiedResponse> VerifyPasswordResetCodeAsync(VerifyPasswordResetCodeRequest request, CancellationToken cancellationToken);
}

public interface IUserService
{
    Task<UserProfileResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken);
    Task<UserProfileResponse> GetPublicProfileAsync(Guid userId, Guid? viewerId, CancellationToken cancellationToken);
    Task<UserProfileResponse> UpdateMeAsync(Guid userId, ProfileUpdateRequest request, CancellationToken cancellationToken);
    Task<UserPreferencesResponse> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken);
    Task<UserPreferencesResponse> UpdatePreferencesAsync(Guid userId, UserPreferencesUpdateRequest request, CancellationToken cancellationToken);
    Task<IReadOnlyList<UserDeviceResponse>> GetDevicesAsync(Guid userId, CancellationToken cancellationToken);
    Task<UserDeviceResponse> RegisterDeviceAsync(Guid userId, RegisterUserDeviceRequest request, CancellationToken cancellationToken);
    Task RemoveDeviceAsync(Guid userId, Guid deviceId, CancellationToken cancellationToken);
}

public interface IVerificationCodeSender
{
    bool IsConfigured { get; }
    Task SendAsync(string channel, string destination, string purpose, string code, CancellationToken cancellationToken);
}

public sealed class ApiException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;

    public static ApiException BadRequest(string code, string message) => new(400, code, message);
    public static ApiException Unauthorized(string code = "UNAUTHORIZED", string message = "Authentication is required or the credentials are invalid.") => new(401, code, message);
    public static ApiException Forbidden(string code, string message) => new(403, code, message);
    public static ApiException NotFound(string code, string message) => new(404, code, message);
    public static ApiException Conflict(string code, string message) => new(409, code, message);
    public static ApiException Unavailable(string code, string message) => new(503, code, message);
    public static ApiException Unprocessable(string code, string message) => new(422, code, message);
}
