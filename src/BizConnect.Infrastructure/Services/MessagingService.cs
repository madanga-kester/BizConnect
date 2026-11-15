using BizConnect.Application.Contracts;
using BizConnect.Application.Services;
using BizConnect.Domain.Accounts;
using BizConnect.Domain.Businesses;
using BizConnect.Domain.Catalogue;
using BizConnect.Domain.Messaging;
using BizConnect.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Services;

/// <summary>REST-backed source of truth for direct conversations and buyer-to-business enquiries.</summary>
public sealed class MessagingService(AppDbContext db, TimeProvider clock, IConversationNotifier notifier, INotificationService notificationWriter) : IMessagingService
{
    private const int MaxPageSize = 50;

    public async Task<ConversationResponse> GetConversationAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken)
    {
        var conversation = await GetConversationAsync(conversationId, cancellationToken);
        await EnsureConversationAccessAsync(actorId, conversation, cancellationToken);
        var participant = await GetParticipantAsync(conversationId, actorId, cancellationToken);
        var unread = await db.ConversationMessages.AsNoTracking().CountAsync(x => x.ConversationId == conversationId && x.SenderUserId != actorId && (participant.LastReadAtUtc == null || x.CreatedAtUtc > participant.LastReadAtUtc), cancellationToken);
        return await MapConversationAsync(conversation, actorId, unread, participant.ArchivedAtUtc != null, cancellationToken);
    }

    public async Task<ConversationPageResponse> ListConversationsAsync(Guid actorId, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        var businessIds = await db.BusinessMemberships.AsNoTracking()
            .Where(x => x.UserId == actorId && x.RevokedAtUtc == null &&
                (x.Role == BusinessRoles.Owner || x.Role == BusinessRoles.Admin || x.Role == BusinessRoles.Editor))
            .Select(x => x.BusinessId).ToListAsync(ct);

        var query = db.Conversations.AsNoTracking().Where(c =>
            (db.ConversationParticipants.Any(p => p.ConversationId == c.Id && p.UserId == actorId && p.ArchivedAtUtc == null) ||
             (c.BusinessId != null && businessIds.Contains(c.BusinessId.Value) &&
              !db.ConversationParticipants.Any(p => p.ConversationId == c.Id && p.UserId == actorId && p.ArchivedAtUtc != null))) &&
            (c.Kind != ConversationKinds.Direct || !db.UserBlocks.Any(x =>
                (x.BlockerUserId == actorId && x.BlockedUserId == c.DirectUserLowId) ||
                (x.BlockerUserId == actorId && x.BlockedUserId == c.DirectUserHighId) ||
                (x.BlockedUserId == actorId && x.BlockerUserId == c.DirectUserLowId) ||
                (x.BlockedUserId == actorId && x.BlockerUserId == c.DirectUserHighId))));
        var total = await query.CountAsync(ct);
        var rows = await query.OrderByDescending(c => c.LastMessageAtUtc ?? c.CreatedAtUtc).ThenByDescending(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        var result = new List<ConversationResponse>(rows.Count);
        foreach (var row in rows)
        {
            await EnsureConversationAccessAsync(actorId, row, ct);
            var participant = await db.ConversationParticipants.AsNoTracking().FirstOrDefaultAsync(x => x.ConversationId == row.Id && x.UserId == actorId, ct);
            var readAt = participant?.LastReadAtUtc;
            var unread = await db.ConversationMessages.AsNoTracking().CountAsync(m => m.ConversationId == row.Id && m.SenderUserId != actorId && (readAt == null || m.CreatedAtUtc > readAt), ct);
            result.Add(await MapConversationAsync(row, actorId, unread, participant?.ArchivedAtUtc != null, ct));
        }
        return new ConversationPageResponse(result, total, page, pageSize);
    }

    public async Task<ConversationResponse> StartConversationAsync(Guid actorId, StartConversationRequest request, CancellationToken ct)
    {
        var hasBusiness = request.BusinessId.HasValue;
        if (hasBusiness == request.ParticipantId.HasValue)
            throw ApiException.BadRequest("CONVERSATION_TARGET_REQUIRED", "Choose exactly one person or business as the conversation target.");
        if (request.CatalogItemId.HasValue && !hasBusiness)
            throw ApiException.BadRequest("ENQUIRY_BUSINESS_REQUIRED", "A catalogue enquiry must include its business.");
        var now = clock.GetUtcNow();
        Conversation conversation;

        if (request.ParticipantId is Guid targetId)
        {
            if (targetId == actorId) throw ApiException.Unprocessable("SELF_CONVERSATION", "You cannot start a conversation with yourself.");
            var target = await db.Users.AsNoTracking().AnyAsync(x => x.Id == targetId && x.IsActive, ct);
            if (!target) throw ApiException.NotFound("USER_NOT_FOUND", "The requested user was not found.");
            var isBlocked = await db.UserBlocks.AnyAsync(x => (x.BlockerUserId == actorId && x.BlockedUserId == targetId) || (x.BlockerUserId == targetId && x.BlockedUserId == actorId), ct);
            if (isBlocked) throw ApiException.NotFound("USER_NOT_FOUND", "The requested user was not found.");
            var profilePrivate = await db.UserProfiles.AsNoTracking().AnyAsync(x => x.UserId == targetId && x.PrivateProfile, ct);
            var followsTarget = await db.UserFollows.AnyAsync(x => x.FollowerUserId == actorId && x.FollowedUserId == targetId, ct);
            if (profilePrivate && !followsTarget)
                throw ApiException.NotFound("USER_NOT_FOUND", "The requested user was not found.");

            var low = actorId.CompareTo(targetId) < 0 ? actorId : targetId;
            var high = actorId.CompareTo(targetId) < 0 ? targetId : actorId;
            conversation = await db.Conversations.FirstOrDefaultAsync(x => x.Kind == ConversationKinds.Direct && x.DirectUserLowId == low && x.DirectUserHighId == high, ct)
                ?? new Conversation { Id = Guid.NewGuid(), Kind = ConversationKinds.Direct, CreatedByUserId = actorId, DirectUserLowId = low, DirectUserHighId = high, CreatedAtUtc = now, UpdatedAtUtc = now };
            if (db.Entry(conversation).State == EntityState.Detached)
            {
                db.Conversations.Add(conversation);
                db.ConversationParticipants.AddRange(
                    NewParticipant(conversation.Id, low, ConversationParticipantKinds.Direct, now),
                    NewParticipant(conversation.Id, high, ConversationParticipantKinds.Direct, now));
                await db.SaveChangesAsync(ct);
            }
        }
        else
        {
            var businessId = request.BusinessId!.Value;
            var business = await db.Businesses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == businessId && x.Status == BusinessStatuses.Active, ct)
                ?? throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
            var isMember = await db.BusinessMemberships.AnyAsync(x => x.BusinessId == businessId && x.UserId == actorId && x.RevokedAtUtc == null, ct);
            var isFollower = await db.BusinessFollows.AnyAsync(x => x.BusinessId == businessId && x.UserId == actorId, ct);
            if (business.Visibility != BusinessVisibility.Public && !isMember && !isFollower)
                throw ApiException.NotFound("BUSINESS_NOT_FOUND", "The business was not found.");
            string? itemTitle = null;
            if (request.CatalogItemId is Guid itemId)
            {
                var item = await db.CatalogItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == itemId && x.BusinessId == businessId && x.Status == CatalogItemStatuses.Published, ct)
                    ?? throw ApiException.NotFound("CATALOGUE_ITEM_NOT_FOUND", "The published catalogue item was not found.");
                itemTitle = item.Title;
            }
            conversation = await db.Conversations.FirstOrDefaultAsync(x => x.Kind == ConversationKinds.Business && x.BusinessId == businessId && x.CreatedByUserId == actorId && x.CatalogItemId == request.CatalogItemId, ct)
                ?? new Conversation { Id = Guid.NewGuid(), Kind = ConversationKinds.Business, CreatedByUserId = actorId, BusinessId = businessId, CatalogItemId = request.CatalogItemId, CatalogueTitleSnapshot = itemTitle, CreatedAtUtc = now, UpdatedAtUtc = now };
            if (db.Entry(conversation).State == EntityState.Detached)
            {
                db.Conversations.Add(conversation);
                db.ConversationParticipants.Add(NewParticipant(conversation.Id, actorId, ConversationParticipantKinds.Buyer, now));
                await db.SaveChangesAsync(ct);
            }
        }

        var messageText = request.FirstMessage?.Trim();
        if (!string.IsNullOrWhiteSpace(messageText))
            await SendMessageAsync(actorId, conversation.Id, new SendConversationMessageRequest(Guid.NewGuid(), messageText), ct);
        var persisted = await db.Conversations.AsNoTracking().FirstAsync(x => x.Id == conversation.Id, ct);
        return await MapConversationAsync(persisted, actorId, 0, false, ct);
    }

    public async Task<ConversationMessagePageResponse> ListMessagesAsync(Guid actorId, Guid conversationId, int page, int pageSize, CancellationToken ct)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        var participant = await GetParticipantAsync(conversationId, actorId, ct);
        var now = clock.GetUtcNow();
        participant.LastDeliveredAtUtc = now;
        await db.SaveChangesAsync(ct);
        var messagesQuery = db.ConversationMessages.AsNoTracking().Where(x => x.ConversationId == conversationId);
        var total = await messagesQuery.CountAsync(ct);
        var messages = await messagesQuery.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        messages.Reverse();
        var statuses = await db.ConversationParticipants.AsNoTracking().Where(x => x.ConversationId == conversationId)
            .Select(x => new ParticipantStatus(x.UserId, x.LastDeliveredAtUtc, x.LastReadAtUtc)).ToListAsync(ct);
        var senderIds = messages.Select(x => x.SenderUserId).Distinct().ToList();
        var profiles = await db.UserProfiles.AsNoTracking().Where(x => senderIds.Contains(x.UserId)).ToDictionaryAsync(x => x.UserId, ct);
        var mapped = messages.Select(m => MapMessage(m, profiles.GetValueOrDefault(m.SenderUserId), actorId, statuses)).ToList();
        return new ConversationMessagePageResponse(mapped, total, page, pageSize);
    }

    public async Task<ConversationMessageResponse> SendMessageAsync(Guid actorId, Guid conversationId, SendConversationMessageRequest request, CancellationToken ct)
    {
        var text = request.Text?.Trim();
        if (request.ClientMessageId == Guid.Empty) throw ApiException.BadRequest("CLIENT_MESSAGE_ID_REQUIRED", "A non-empty client message ID is required for safe retries.");
        if (string.IsNullOrWhiteSpace(text) || text.Length > 5000) throw ApiException.Unprocessable("MESSAGE_TEXT_INVALID", "A message must contain 1 to 5000 characters.");
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        if (conversation.IsBlocked) throw ApiException.Conflict("CONVERSATION_BLOCKED", "This conversation is blocked and cannot receive messages.");
        await EnsureNoUserBlockAsync(actorId, conversation, ct);

        var previous = await db.ConversationMessages.AsNoTracking().FirstOrDefaultAsync(x => x.ConversationId == conversationId && x.SenderUserId == actorId && x.ClientMessageId == request.ClientMessageId, ct);
        if (previous is not null)
        {
            var previousProfile = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == actorId, ct);
            var states = await db.ConversationParticipants.AsNoTracking().Where(x => x.ConversationId == conversationId).Select(x => new ParticipantStatus(x.UserId, x.LastDeliveredAtUtc, x.LastReadAtUtc)).ToListAsync(ct);
            return MapMessage(previous, previousProfile, actorId, states);
        }

        var now = clock.GetUtcNow();
        var message = new ConversationMessage { Id = Guid.NewGuid(), ConversationId = conversationId, SenderUserId = actorId, ClientMessageId = request.ClientMessageId, Text = text, CreatedAtUtc = now };
        conversation.LastMessageAtUtc = now;
        conversation.UpdatedAtUtc = now;
        conversation.LastMessagePreview = text.Length <= 240 ? text : text[..240];
        var recipients = conversation.Kind == ConversationKinds.Business
            ? conversation.CreatedByUserId == actorId
                ? await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == conversation.BusinessId && x.RevokedAtUtc == null
                    && (x.Role == BusinessRoles.Owner || x.Role == BusinessRoles.Admin || x.Role == BusinessRoles.Editor))
                    .Select(x => x.UserId).ToListAsync(ct)
                : await db.ConversationParticipants.AsNoTracking().Where(x => x.ConversationId == conversationId && x.UserId != actorId
                    && x.Kind == ConversationParticipantKinds.Buyer).Select(x => x.UserId).ToListAsync(ct)
            : await db.ConversationParticipants.AsNoTracking().Where(x => x.ConversationId == conversationId && x.UserId != actorId)
                .Select(x => x.UserId).ToListAsync(ct);
        var isBuyerEnquiry = conversation.Kind == ConversationKinds.Business && conversation.CreatedByUserId == actorId;
        await using (var tx = await db.Database.BeginTransactionAsync(ct))
        {
            // New activity restores a thread hidden by an earlier per-user archive.
            await db.ConversationParticipants.Where(x => x.ConversationId == conversationId).ExecuteUpdateAsync(s => s.SetProperty(x => x.ArchivedAtUtc, (DateTimeOffset?)null), ct);
            db.ConversationMessages.Add(message);
            await notificationWriter.CreateEventAsync(new NotificationEventRequest(actorId, recipients,
                isBuyerEnquiry ? "enquiry" : "message", isBuyerEnquiry ? "New business enquiry" : "New message",
                isBuyerEnquiry ? "A customer sent a business enquiry." : "You received a new message.",
                "conversation", conversationId, $"message:{message.Id:N}", conversation.BusinessId, ConversationId: conversationId), ct);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        var senderProfile = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == actorId, ct);
        var participantStates = await db.ConversationParticipants.AsNoTracking().Where(x => x.ConversationId == conversationId).Select(x => new ParticipantStatus(x.UserId, x.LastDeliveredAtUtc, x.LastReadAtUtc)).ToListAsync(ct);
        var response = MapMessage(message, senderProfile, actorId, participantStates);
        await notifier.MessageReceivedAsync(conversationId, response, ct);
        var summary = await MapConversationAsync(conversation, actorId, 0, false, ct);
        await notifier.ConversationChangedAsync(conversationId, summary, ct);
        return response;
    }

    public async Task MarkDeliveredAsync(Guid actorId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        var participant = await GetParticipantAsync(conversationId, actorId, ct);
        var now = clock.GetUtcNow();
        participant.LastDeliveredAtUtc = now;
        await db.SaveChangesAsync(ct);
        await notifier.MessageStatusChangedAsync(conversationId, Guid.Empty, "delivered", ct);
    }

    public async Task MarkReadAsync(Guid actorId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        var participant = await GetParticipantAsync(conversationId, actorId, ct);
        var now = clock.GetUtcNow();
        participant.LastDeliveredAtUtc = now;
        participant.LastReadAtUtc = now;
        participant.ArchivedAtUtc = null;
        await db.SaveChangesAsync(ct);
        await notifier.ConversationReadAsync(conversationId, actorId, now, ct);
    }

    public async Task ArchiveAsync(Guid actorId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        var participant = await GetParticipantAsync(conversationId, actorId, ct);
        participant.ArchivedAtUtc = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
    }

    public async Task BlockAsync(Guid actorId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        if (!conversation.IsBlocked)
        {
            conversation.IsBlocked = true;
            conversation.BlockedByUserId = actorId;
            conversation.BlockedAtUtc = clock.GetUtcNow();
            conversation.UpdatedAtUtc = clock.GetUtcNow();
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task UnblockAsync(Guid actorId, Guid conversationId, CancellationToken ct)
    {
        var conversation = await GetConversationAsync(conversationId, ct);
        await EnsureConversationAccessAsync(actorId, conversation, ct);
        if (conversation.IsBlocked && conversation.BlockedByUserId != actorId)
            throw ApiException.Forbidden("CONVERSATION_UNBLOCK_DENIED", "Only the user who blocked this conversation can unblock it.");
        conversation.IsBlocked = false;
        conversation.BlockedByUserId = null;
        conversation.BlockedAtUtc = null;
        conversation.UpdatedAtUtc = clock.GetUtcNow();
        await db.SaveChangesAsync(ct);
    }

    public async Task EnsureAccessAsync(Guid actorId, Guid conversationId, CancellationToken cancellationToken)
    {
        var conversation = await GetConversationAsync(conversationId, cancellationToken);
        await EnsureConversationAccessAsync(actorId, conversation, cancellationToken);
    }

    private async Task EnsureConversationAccessAsync(Guid actorId, Conversation conversation, CancellationToken ct)
    {
        if (conversation.Kind == ConversationKinds.Direct)
        {
            var participant = await db.ConversationParticipants.AnyAsync(x => x.ConversationId == conversation.Id && x.UserId == actorId, ct);
            if (!participant) throw ApiException.NotFound("CONVERSATION_NOT_FOUND", "The conversation was not found.");
            await EnsureNoUserBlockAsync(actorId, conversation, ct);
            return;
        }

        if (conversation.CreatedByUserId == actorId)
        {
            await EnsureParticipantRowAsync(conversation, actorId, ConversationParticipantKinds.Buyer, ct);
            return;
        }
        var role = await db.BusinessMemberships.AsNoTracking().Where(x => x.BusinessId == conversation.BusinessId && x.UserId == actorId && x.RevokedAtUtc == null).Select(x => x.Role).FirstOrDefaultAsync(ct);
        if (!BusinessAccessControl.Allows(role, BusinessPermission.RespondToEnquiries))
            throw ApiException.NotFound("CONVERSATION_NOT_FOUND", "The conversation was not found.");
        await EnsureParticipantRowAsync(conversation, actorId, ConversationParticipantKinds.BusinessAgent, ct);
    }

    private async Task EnsureNoUserBlockAsync(Guid actorId, Conversation conversation, CancellationToken ct)
    {
        if (conversation.Kind == ConversationKinds.Direct)
        {
            var other = conversation.DirectUserLowId == actorId ? conversation.DirectUserHighId!.Value : conversation.DirectUserLowId!.Value;
            if (await db.UserBlocks.AnyAsync(x => (x.BlockerUserId == actorId && x.BlockedUserId == other) || (x.BlockerUserId == other && x.BlockedUserId == actorId), ct))
                throw ApiException.NotFound("CONVERSATION_NOT_FOUND", "The conversation was not found.");
        }
        else if (conversation.CreatedByUserId == actorId)
        {
            var agents = db.BusinessMemberships.Where(x => x.BusinessId == conversation.BusinessId && x.RevokedAtUtc == null).Select(x => x.UserId)
                .Union(db.Businesses.Where(x => x.Id == conversation.BusinessId).Select(x => x.OwnerUserId));
            if (await db.UserBlocks.AnyAsync(x => agents.Contains(x.BlockedUserId) && x.BlockerUserId == actorId || agents.Contains(x.BlockerUserId) && x.BlockedUserId == actorId, ct))
                throw ApiException.Conflict("MESSAGING_BLOCKED", "Messaging is blocked between you and this business team.");
        }
        else if (await db.UserBlocks.AnyAsync(x => (x.BlockerUserId == actorId && x.BlockedUserId == conversation.CreatedByUserId) || (x.BlockerUserId == conversation.CreatedByUserId && x.BlockedUserId == actorId), ct))
            throw ApiException.Conflict("MESSAGING_BLOCKED", "Messaging is blocked between you and this buyer.");
    }

    private async Task EnsureParticipantRowAsync(Conversation conversation, Guid userId, string kind, CancellationToken ct)
    {
        var row = await db.ConversationParticipants.FirstOrDefaultAsync(x => x.ConversationId == conversation.Id && x.UserId == userId, ct);
        if (row is null)
        {
            db.ConversationParticipants.Add(NewParticipant(conversation.Id, userId, kind, clock.GetUtcNow()));
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task<ConversationParticipant> GetParticipantAsync(Guid conversationId, Guid userId, CancellationToken ct) =>
        await db.ConversationParticipants.FirstOrDefaultAsync(x => x.ConversationId == conversationId && x.UserId == userId, ct)
        ?? throw ApiException.NotFound("CONVERSATION_NOT_FOUND", "The conversation was not found.");

    private async Task<Conversation> GetConversationAsync(Guid id, CancellationToken ct) =>
        await db.Conversations.FirstOrDefaultAsync(x => x.Id == id, ct)
        ?? throw ApiException.NotFound("CONVERSATION_NOT_FOUND", "The conversation was not found.");

    private async Task<ConversationResponse> MapConversationAsync(Conversation c, Guid actorId, int unread, bool archived, CancellationToken ct)
    {
        string? businessId = c.BusinessId?.ToString();
        string? businessName = null;
        string? catalogTitle = c.CatalogueTitleSnapshot;
        string? participantId;
        string participantName;
        if (c.Kind == ConversationKinds.Business)
        {
            var business = await db.Businesses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == c.BusinessId, ct);
            businessName = business?.Name;
            if (actorId == c.CreatedByUserId)
            {
                participantId = c.BusinessId?.ToString();
                participantName = businessName ?? "Business";
            }
            else
            {
                participantId = c.CreatedByUserId.ToString();
                participantName = await DisplayNameAsync(c.CreatedByUserId, ct);
            }
            if (c.CatalogItemId is Guid itemId)
                catalogTitle = await db.CatalogItems.AsNoTracking().Where(x => x.Id == itemId).Select(x => x.Title).FirstOrDefaultAsync(ct) ?? catalogTitle;
        }
        else
        {
            var other = c.DirectUserLowId == actorId ? c.DirectUserHighId!.Value : c.DirectUserLowId!.Value;
            participantId = other.ToString();
            participantName = await DisplayNameAsync(other, ct);
        }
        return new ConversationResponse(c.Id.ToString(), c.Kind, businessId, businessName, c.CatalogItemId?.ToString(), catalogTitle,
            participantId, participantName, c.LastMessagePreview, c.LastMessageAtUtc, unread, archived, c.IsBlocked,
            c.BlockedByUserId?.ToString(), c.CreatedAtUtc);
    }

    private async Task<string> DisplayNameAsync(Guid userId, CancellationToken ct) =>
        await db.UserProfiles.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.Name).FirstOrDefaultAsync(ct) ?? "BizConnect member";

    private static ConversationMessageResponse MapMessage(ConversationMessage m, UserProfile? profile, Guid actorId, IReadOnlyList<ParticipantStatus> statuses)
    {
        var recipients = statuses.Where(x => x.UserId != m.SenderUserId).ToList();
        var status = recipients.Any(x => x.LastReadAtUtc >= m.CreatedAtUtc) ? "read" :
            recipients.Any(x => x.LastDeliveredAtUtc >= m.CreatedAtUtc) ? "delivered" : "sent";
        return new ConversationMessageResponse(m.Id.ToString(), m.ConversationId.ToString(), m.SenderUserId.ToString(), profile?.Name ?? "BizConnect member", m.Text, m.CreatedAtUtc, status, m.ClientMessageId.ToString());
    }

    private static ConversationParticipant NewParticipant(Guid conversationId, Guid userId, string kind, DateTimeOffset now) =>
        new() { Id = Guid.NewGuid(), ConversationId = conversationId, UserId = userId, Kind = kind, JoinedAtUtc = now };

    private static (int Page, int PageSize) NormalizePage(int page, int pageSize) =>
        (Math.Max(page, 1), Math.Clamp(pageSize, 1, MaxPageSize));

    private sealed record ParticipantStatus(Guid UserId, DateTimeOffset? LastDeliveredAtUtc, DateTimeOffset? LastReadAtUtc);
}
