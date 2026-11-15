namespace BizConnect.Application.Contracts;

public sealed record StartConversationRequest(Guid? ParticipantId, Guid? BusinessId, Guid? CatalogItemId, string? FirstMessage);
public sealed record SendConversationMessageRequest(Guid ClientMessageId, string Text);
public sealed record ConversationMessageResponse(string Id, string ConversationId, string SenderUserId, string SenderName, string Text, DateTimeOffset CreatedAt, string Status, string ClientMessageId);
public sealed record ConversationResponse(
    string Id, string Kind, string? BusinessId, string? BusinessName, string? CatalogItemId, string? CatalogItemTitle,
    string? ParticipantId, string ParticipantName, string LastMessage, DateTimeOffset? LastMessageAt,
    int UnreadCount, bool IsArchived, bool IsBlocked, string? BlockedByUserId, DateTimeOffset CreatedAt);
public sealed record ConversationPageResponse(IReadOnlyList<ConversationResponse> Items, int Total, int Page, int PageSize);
public sealed record ConversationMessagePageResponse(IReadOnlyList<ConversationMessageResponse> Items, int Total, int Page, int PageSize);

public interface IConversationNotifier
{
    Task MessageReceivedAsync(Guid conversationId, ConversationMessageResponse message, CancellationToken cancellationToken);
    Task ConversationReadAsync(Guid conversationId, Guid readerUserId, DateTimeOffset readAt, CancellationToken cancellationToken);
    Task MessageStatusChangedAsync(Guid conversationId, Guid messageId, string status, CancellationToken cancellationToken);
    Task ConversationChangedAsync(Guid conversationId, ConversationResponse conversation, CancellationToken cancellationToken);
}
