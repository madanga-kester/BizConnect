namespace BizConnect.Application.Services;

public sealed record PushNotificationMessage(string Token, string Title, string Body, string NotificationId, string TargetType, string? TargetId, string? BusinessId, string? PostId, string? ConversationId, string? CatalogItemId);
public sealed record PushNotificationResult(bool Accepted, bool InvalidToken, bool Retryable, string? ReceiptId, string? ErrorCode);

public interface IPushNotificationProvider
{
    bool IsConfigured { get; }
    Task<PushNotificationResult> SendAsync(PushNotificationMessage message, CancellationToken cancellationToken);
}
