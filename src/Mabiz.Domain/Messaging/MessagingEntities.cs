namespace Mabiz.Domain.Messaging;

public static class ConversationKinds
{
    public const string Direct = "direct";
    public const string Business = "business";
}

public static class ConversationParticipantKinds
{
    public const string Direct = "direct";
    public const string Buyer = "buyer";
    public const string BusinessAgent = "business_agent";
}

/// <summary>A private one-to-one thread or a buyer-to-business enquiry thread.</summary>
public sealed class Conversation
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = ConversationKinds.Direct;
    public Guid CreatedByUserId { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? CatalogItemId { get; set; }
    public Guid? DirectUserLowId { get; set; }
    public Guid? DirectUserHighId { get; set; }
    public string? CatalogueTitleSnapshot { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }
    public DateTimeOffset? LastMessageAtUtc { get; set; }
    public string LastMessagePreview { get; set; } = string.Empty;
    public bool IsBlocked { get; set; }
    public Guid? BlockedByUserId { get; set; }
    public DateTimeOffset? BlockedAtUtc { get; set; }
}

/// <summary>Per-user inbox state. Business staff are added when they first open or reply to an enquiry.</summary>
public sealed class ConversationParticipant
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public string Kind { get; set; } = ConversationParticipantKinds.Direct;
    public DateTimeOffset JoinedAtUtc { get; set; }
    public DateTimeOffset? LastDeliveredAtUtc { get; set; }
    public DateTimeOffset? LastReadAtUtc { get; set; }
    public DateTimeOffset? ArchivedAtUtc { get; set; }
}

public sealed class ConversationMessage
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Guid SenderUserId { get; set; }
    public Guid ClientMessageId { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTimeOffset CreatedAtUtc { get; set; }
}
