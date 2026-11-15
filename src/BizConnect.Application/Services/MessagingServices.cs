using BizConnect.Application.Contracts;

namespace BizConnect.Application.Services;

public interface IMessagingService
{
    Task<ConversationPageResponse> ListConversationsAsync(Guid actorId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ConversationResponse> GetConversationAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task<ConversationResponse> StartConversationAsync(Guid actorId, StartConversationRequest request, CancellationToken cancellationToken);
    Task<ConversationMessagePageResponse> ListMessagesAsync(Guid actorId, Guid conversationId, int page, int pageSize, CancellationToken cancellationToken);
    Task<ConversationMessageResponse> SendMessageAsync(Guid actorId, Guid conversationId, SendConversationMessageRequest request, CancellationToken cancellationToken);
    Task MarkDeliveredAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task MarkReadAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task ArchiveAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task BlockAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task UnblockAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
    Task EnsureAccessAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken);
}
