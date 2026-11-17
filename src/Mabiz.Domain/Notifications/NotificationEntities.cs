namespace Mabiz.Domain.Notifications;

/// <summary>A recipient-scoped, durable in-app notification created with its source event.</summary>
public sealed class UserNotification
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetId { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? PostId { get; set; }
    public Guid? ConversationId { get; set; }
    public Guid? CatalogItemId { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
    public bool InAppVisible { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ReadAtUtc { get; set; }
    public DateTimeOffset? DismissedAtUtc { get; set; }
}

/// <summary>Retryable per-channel delivery. Push rows are unique per notification/device.</summary>
public sealed class NotificationDelivery
{
    public Guid Id { get; set; }
    public Guid NotificationId { get; set; }
    public Guid? DeviceId { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string Status { get; set; } = NotificationDeliveryStatuses.Pending;
    public int AttemptCount { get; set; }
    public DateTimeOffset AvailableAtUtc { get; set; }
    public DateTimeOffset? LockedUntilUtc { get; set; }
    public DateTimeOffset? CompletedAtUtc { get; set; }
    public string? ProviderReceiptId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public string? LastError { get; set; }
}

public static class NotificationDeliveryStatuses
{
    public const string Pending = "pending";
    public const string Processing = "processing";
    public const string Accepted = "accepted";
    public const string Suppressed = "suppressed";
    public const string Dead = "dead";
}

public static class NotificationDeliveryChannels
{
    public const string Realtime = "realtime";
    public const string Push = "push";
}
