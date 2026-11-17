using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Mabiz.Api.Hubs;

[Authorize]
public sealed class MessagingHub(IMessagingService messaging) : Hub
{
    public async Task JoinConversation(Guid conversationId)
    {
        var userId = CurrentUserId();
        await messaging.EnsureAccessAsync(userId, conversationId, Context.ConnectionAborted);
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(conversationId), Context.ConnectionAborted);
    }

    public Task LeaveConversation(Guid conversationId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(conversationId), Context.ConnectionAborted);

    /// <summary>Persists through the same service as REST; the hub is transport only, never the source of truth.</summary>
    public Task<ConversationMessageResponse> SendMessage(Guid conversationId, Guid clientMessageId, string text) =>
        messaging.SendMessageAsync(CurrentUserId(), conversationId,
            new SendConversationMessageRequest(clientMessageId, text), Context.ConnectionAborted);

    public override async Task OnConnectedAsync()
    {
        var userId = CurrentUserId(); // Reject authenticated principals without the expected GUID subject.
        // Clients cannot choose a recipient group. The only user notification group joined is derived
        // from the validated authenticated subject.
        await Groups.AddToGroupAsync(Context.ConnectionId, NotificationGroup(userId), Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }

    public static string GroupName(Guid conversationId) => $"conversation:{conversationId:N}";
    public static string NotificationGroup(Guid userId) => $"notifications:{userId:N}";

    private Guid CurrentUserId()
    {
        var subject = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(subject, out var userId))
            throw new HubException("The authenticated session has no valid user identity.");
        return userId;
    }
}

public sealed class SignalRConversationNotifier(IHubContext<MessagingHub> hub) : IConversationNotifier
{
    public Task MessageReceivedAsync(Guid conversationId, ConversationMessageResponse message, CancellationToken cancellationToken) =>
        hub.Clients.Group(MessagingHub.GroupName(conversationId)).SendAsync("MessageReceived", message, cancellationToken);

    public Task ConversationReadAsync(Guid conversationId, Guid readerUserId, DateTimeOffset readAt, CancellationToken cancellationToken) =>
        hub.Clients.Group(MessagingHub.GroupName(conversationId)).SendAsync("ConversationRead", new { conversationId, readerUserId, readAt }, cancellationToken);

    public Task MessageStatusChangedAsync(Guid conversationId, Guid messageId, string status, CancellationToken cancellationToken) =>
        hub.Clients.Group(MessagingHub.GroupName(conversationId)).SendAsync("MessageStatusChanged", new { conversationId, messageId, status }, cancellationToken);

    public Task ConversationChangedAsync(Guid conversationId, ConversationResponse conversation, CancellationToken cancellationToken) =>
        hub.Clients.Group(MessagingHub.GroupName(conversationId)).SendAsync("ConversationChanged", conversation, cancellationToken);
}
