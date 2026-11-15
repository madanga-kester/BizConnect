using BizConnect.Application.Contracts;

namespace BizConnect.Application.Services;

public interface INotificationService
{
    Task<NotificationPageResponse> ListAsync(Guid userId, int page, int pageSize, bool unreadOnly, CancellationToken cancellationToken);
    Task<NotificationUnreadCountResponse> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken);
    Task MarkReadAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken);
    Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken);
    Task DismissAsync(Guid userId, Guid notificationId, CancellationToken cancellationToken);
    Task<NotificationPreferencesResponse> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken);
    Task<NotificationPreferencesResponse> UpdatePreferencesAsync(Guid userId, NotificationPreferencesUpdateRequest request, CancellationToken cancellationToken);
    /// <summary>Adds preference-filtered notifications and delivery outbox rows to the current DbContext unit of work.</summary>
    Task CreateEventAsync(NotificationEventRequest request, CancellationToken cancellationToken);
}
