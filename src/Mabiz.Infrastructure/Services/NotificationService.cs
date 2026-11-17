using Mabiz.Application.Contracts;
using Mabiz.Application.Services;
using Mabiz.Domain.Accounts;
using Mabiz.Domain.Notifications;
using Mabiz.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Services;

public sealed class NotificationService(AppDbContext db, TimeProvider clock) : INotificationService
{
    public async Task<NotificationPageResponse> ListAsync(Guid userId, int page, int pageSize, bool unreadOnly, CancellationToken cancellationToken)
    {
        (page, pageSize) = NormalizePage(page, pageSize);
        var query = db.Notifications.AsNoTracking().Where(x => x.RecipientUserId == userId && x.InAppVisible && x.DismissedAtUtc == null);
        if (unreadOnly) query = query.Where(x => x.ReadAtUtc == null);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query.OrderByDescending(x => x.CreatedAtUtc).ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
        var actorIds = rows.Where(x => x.ActorUserId.HasValue).Select(x => x.ActorUserId!.Value).Distinct().ToArray();
        var actorNames = actorIds.Length == 0 ? new Dictionary<Guid, string>() : await db.UserProfiles.AsNoTracking()
            .Where(x => actorIds.Contains(x.UserId)).ToDictionaryAsync(x => x.UserId, x => x.Name, cancellationToken);
        return new NotificationPageResponse(rows.Select(x => Map(x, actorNames)).ToList(), total, page, pageSize);
    }

    public async Task<NotificationUnreadCountResponse> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken) =>
        new(await db.Notifications.AsNoTracking().CountAsync(x => x.RecipientUserId == userId && x.InAppVisible && x.DismissedAtUtc == null && x.ReadAtUtc == null, cancellationToken));

    public async Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken)
    {
        var row = await db.Notifications.SingleOrDefaultAsync(x => x.Id == notificationId && x.RecipientUserId == userId && x.InAppVisible && x.DismissedAtUtc == null, cancellationToken)
            ?? throw ApiException.NotFound("NOTIFICATION_NOT_FOUND", "The notification was not found.");
        row.ReadAtUtc ??= clock.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken)
    {
        var now = clock.GetUtcNow();
        await db.Notifications.Where(x => x.RecipientUserId == userId && x.InAppVisible && x.DismissedAtUtc == null && x.ReadAtUtc == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ReadAtUtc, now), cancellationToken);
    }

    public async Task DismissAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken)
    {
        var row = await db.Notifications.SingleOrDefaultAsync(x => x.Id == notificationId && x.RecipientUserId == userId && x.InAppVisible && x.DismissedAtUtc == null, cancellationToken)
            ?? throw ApiException.NotFound("NOTIFICATION_NOT_FOUND", "The notification was not found.");
        row.DismissedAtUtc = clock.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<NotificationPreferencesResponse> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var preferences = await db.UserNotificationPreferences.AsNoTracking().SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("NOTIFICATION_PREFERENCES_NOT_FOUND", "Notification preferences were not found.");
        return MapPreferences(preferences);
    }

    public async Task<NotificationPreferencesResponse> UpdatePreferencesAsync(Guid userId, NotificationPreferencesUpdateRequest request, CancellationToken cancellationToken)
    {
        var preferences = await db.UserNotificationPreferences.SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? throw ApiException.NotFound("NOTIFICATION_PREFERENCES_NOT_FOUND", "Notification preferences were not found.");
        if (request.InAppEnabled.HasValue) preferences.InAppEnabled = request.InAppEnabled.Value;
        if (request.PushEnabled.HasValue) preferences.PushEnabled = request.PushEnabled.Value;
        if (request.Messages.HasValue) preferences.Messages = request.Messages.Value;
        if (request.Likes.HasValue) preferences.Likes = request.Likes.Value;
        if (request.Comments.HasValue) preferences.Comments = request.Comments.Value;
        if (request.NewFollowers.HasValue) preferences.NewFollowers = request.NewFollowers.Value;
        if (request.BusinessTeamActivity.HasValue) preferences.BusinessTeamActivity = request.BusinessTeamActivity.Value;
        if (request.BusinessUpdates.HasValue) preferences.BusinessUpdates = request.BusinessUpdates.Value;
        preferences.UpdatedAtUtc = clock.GetUtcNow();
        await db.SaveChangesAsync(cancellationToken);
        return MapPreferences(preferences);
    }

    /// <summary>Adds the inbox record and delivery rows to the caller's current EF unit of work.</summary>
    public async Task CreateEventAsync(NotificationEventRequest request, CancellationToken cancellationToken)
    {
        if (request.EventKey.Length > 140 || string.IsNullOrWhiteSpace(request.EventKey))
            throw new ArgumentException("A stable event key of at most 140 characters is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Type) || request.Type.Length > 40 || request.Title.Length is 0 or > 120 || request.Body.Length is 0 or > 240)
            throw new ArgumentException("Notification type, title, or body is invalid.", nameof(request));

        var recipients = request.RecipientUserIds.Where(x => x != request.ActorUserId).Distinct().ToArray();
        if (recipients.Length == 0) return;
        var preferenceMap = await db.UserNotificationPreferences.AsNoTracking().Where(x => recipients.Contains(x.UserId))
            .ToDictionaryAsync(x => x.UserId, cancellationToken);
        var existingKeys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var recipientId in recipients)
        {
            var pref = preferenceMap.GetValueOrDefault(recipientId);
            var categoryEnabled = IsCategoryEnabled(pref, request.Type);
            var inApp = categoryEnabled && (pref?.InAppEnabled ?? true);
            var push = categoryEnabled && (pref?.PushEnabled ?? false);
            if (!inApp && !push) continue;
            var eventKey = $"{request.EventKey}:{recipientId:N}";
            if (await db.Notifications.AnyAsync(x => x.RecipientUserId == recipientId && x.IdempotencyKey == eventKey, cancellationToken)) continue;
            if (!existingKeys.Add(eventKey)) continue;

            var now = clock.GetUtcNow();
            var notification = new UserNotification
            {
                Id = Guid.NewGuid(), RecipientUserId = recipientId, ActorUserId = request.ActorUserId,
                Type = request.Type, Title = request.Title.Trim(), Body = request.Body.Trim(), TargetType = request.TargetType,
                TargetId = request.TargetId, BusinessId = request.BusinessId, PostId = request.PostId,
                ConversationId = request.ConversationId, CatalogItemId = request.CatalogItemId,
                IdempotencyKey = eventKey, InAppVisible = inApp, CreatedAtUtc = now
            };
            db.Notifications.Add(notification);
            if (inApp)
            {
                db.NotificationDeliveries.Add(new NotificationDelivery
                {
                    Id = Guid.NewGuid(), NotificationId = notification.Id, Channel = NotificationDeliveryChannels.Realtime,
                    IdempotencyKey = $"{notification.Id:N}:realtime", AvailableAtUtc = now, CreatedAtUtc = now, UpdatedAtUtc = now
                });
            }
            if (push)
            {
                var devices = await db.UserDevices.AsNoTracking().Where(x => x.UserId == recipientId && x.RevokedAtUtc == null && x.PushTokenHash != null)
                    .Select(x => x.Id).ToListAsync(cancellationToken);
                foreach (var deviceId in devices)
                {
                    db.NotificationDeliveries.Add(new NotificationDelivery
                    {
                        Id = Guid.NewGuid(), NotificationId = notification.Id, DeviceId = deviceId,
                        Channel = NotificationDeliveryChannels.Push, IdempotencyKey = $"{notification.Id:N}:push:{deviceId:N}",
                        AvailableAtUtc = now, CreatedAtUtc = now, UpdatedAtUtc = now
                    });
                }
            }
        }
    }

    private static bool IsCategoryEnabled(UserNotificationPreferences? preferences, string type)
    {
        if (preferences is null) return true;
        return type switch
        {
            "message" or "enquiry" => preferences.Messages,
            "like" => preferences.Likes,
            "comment" or "reply" => preferences.Comments,
            "follow" => preferences.NewFollowers,
            "team_invitation" or "team_invitation_accepted" or "team_role_changed" or "ownership_transfer" => preferences.BusinessTeamActivity,
            "business_update" or "catalogue_update" => preferences.BusinessUpdates,
            _ => true
        };
    }

    private static NotificationResponse Map(UserNotification x, IReadOnlyDictionary<Guid, string> actorNames) => new(
        x.Id.ToString(), x.Type, x.ActorUserId?.ToString(), x.ActorUserId.HasValue ? actorNames.GetValueOrDefault(x.ActorUserId.Value) : null,
        x.Title, x.Body, x.TargetType, x.TargetId?.ToString(), x.BusinessId?.ToString(), x.PostId?.ToString(),
        x.ConversationId?.ToString(), x.CatalogItemId?.ToString(), x.CreatedAtUtc, x.ReadAtUtc, x.ReadAtUtc.HasValue);

    private static NotificationPreferencesResponse MapPreferences(UserNotificationPreferences x) => new(
        x.InAppEnabled, x.PushEnabled, x.Messages, x.Likes, x.Comments, x.NewFollowers, x.BusinessTeamActivity, x.BusinessUpdates);

    private static (int Page, int PageSize) NormalizePage(int page, int pageSize) => (Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
}
