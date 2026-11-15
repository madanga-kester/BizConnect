using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BizConnect.Api.Hubs;
using BizConnect.Application.Configuration;
using BizConnect.Application.Services;
using BizConnect.Domain.Accounts;
using BizConnect.Domain.Notifications;
using BizConnect.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BizConnect.Api.BackgroundServices;

/// <summary>
/// Claims outbox rows optimistically (lease + compare-and-set), performs provider/network work outside a
/// database transaction, and records bounded retries. Push is at-least-once across a crash after provider
/// acceptance; provider acceptance is not a device-delivery receipt.
/// </summary>
public sealed class NotificationDeliveryWorker(
    IServiceScopeFactory scopeFactory,
    IHubContext<MessagingHub> hub,
    IDataProtectionProvider protectionProvider,
    IOptions<PushOptions> options,
    ILogger<NotificationDeliveryWorker> logger) : BackgroundService
{
    private readonly PushOptions _options = options.Value;
    private readonly IDataProtector _tokenProtector = protectionProvider.CreateProtector("BizConnect.Device.ExpoPushToken.v1");

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delay = TimeSpan.FromSeconds(Math.Clamp(_options.PollIntervalSeconds, 1, 60));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var worked = await ProcessBatchAsync(stoppingToken);
                if (worked == 0) await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception exception)
            {
                logger.LogError(exception, "Notification delivery batch failed; the leased outbox rows will be retried.");
                await Task.Delay(delay, stoppingToken);
            }
        }
    }

    private async Task<int> ProcessBatchAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var pushProvider = scope.ServiceProvider.GetRequiredService<IPushNotificationProvider>();
        var now = DateTimeOffset.UtcNow;
        var batchSize = Math.Clamp(_options.BatchSize, 1, 100);
        var ids = await db.NotificationDeliveries.AsNoTracking()
            .Where(x => (x.Status == NotificationDeliveryStatuses.Pending && x.AvailableAtUtc <= now)
                || (x.Status == NotificationDeliveryStatuses.Processing && x.LockedUntilUtc != null && x.LockedUntilUtc <= now))
            .OrderBy(x => x.AvailableAtUtc).ThenBy(x => x.CreatedAtUtc).Select(x => x.Id).Take(batchSize).ToListAsync(cancellationToken);
        var processed = 0;
        foreach (var id in ids)
        {
            var leaseUntil = now.AddMinutes(2);
            var claimed = await db.NotificationDeliveries.Where(x => x.Id == id
                    && ((x.Status == NotificationDeliveryStatuses.Pending && x.AvailableAtUtc <= now)
                        || (x.Status == NotificationDeliveryStatuses.Processing && x.LockedUntilUtc != null && x.LockedUntilUtc <= now)))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Status, NotificationDeliveryStatuses.Processing)
                    .SetProperty(x => x.LockedUntilUtc, leaseUntil)
                    .SetProperty(x => x.AttemptCount, x => x.AttemptCount + 1)
                    .SetProperty(x => x.UpdatedAtUtc, now), cancellationToken);
            if (claimed == 0) continue;
            processed++;
            await ProcessOneAsync(db, pushProvider, id, cancellationToken);
        }
        return processed;
    }

    private async Task ProcessOneAsync(AppDbContext db, IPushNotificationProvider pushProvider, Guid deliveryId, CancellationToken cancellationToken)
    {
        var delivery = await db.NotificationDeliveries.SingleAsync(x => x.Id == deliveryId, cancellationToken);
        var notification = await db.Notifications.SingleAsync(x => x.Id == delivery.NotificationId, cancellationToken);
        if (delivery.Channel == NotificationDeliveryChannels.Realtime)
        {
            try
            {
                await hub.Clients.Group(MessagingHub.NotificationGroup(notification.RecipientUserId))
                    .SendAsync("NotificationReceived", new { id = notification.Id, type = notification.Type, createdAt = notification.CreatedAtUtc }, cancellationToken);
                Complete(delivery, "realtime_signalr_send_completed", DateTimeOffset.UtcNow);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                RetryOrDead(delivery, _options.MaxAttempts, "signalr_send_failed", DateTimeOffset.UtcNow);
                logger.LogWarning("SignalR notification event {NotificationId} will be retried after a transient send failure.", notification.Id);
            }
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        if (delivery.Channel != NotificationDeliveryChannels.Push || !pushProvider.IsConfigured)
        {
            Suppress(delivery, delivery.Channel == NotificationDeliveryChannels.Push ? "provider_unconfigured" : "unsupported_channel", DateTimeOffset.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var device = delivery.DeviceId.HasValue
            ? await db.UserDevices.SingleOrDefaultAsync(x => x.Id == delivery.DeviceId && x.UserId == notification.RecipientUserId && x.RevokedAtUtc == null, cancellationToken)
            : null;
        if (device is null || device.PushTokenEncrypted is null || device.PushTokenHash is null)
        {
            Suppress(delivery, "device_token_unavailable", DateTimeOffset.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        string token;
        try { token = _tokenProtector.Unprotect(device.PushTokenEncrypted); }
        catch (Exception exception) when (exception is System.Security.Cryptography.CryptographicException or FormatException)
        {
            device.PushTokenEncrypted = null; device.PushTokenHash = null; device.PushTokenUpdatedAtUtc = DateTimeOffset.UtcNow;
            Suppress(delivery, "device_token_unreadable", DateTimeOffset.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        var result = await pushProvider.SendAsync(new PushNotificationMessage(token, notification.Title, notification.Body,
            notification.Id.ToString(), notification.TargetType, notification.TargetId?.ToString(), notification.BusinessId?.ToString(),
            notification.PostId?.ToString(), notification.ConversationId?.ToString(), notification.CatalogItemId?.ToString()), cancellationToken);
        var completedAt = DateTimeOffset.UtcNow;
        delivery.ProviderReceiptId = result.ReceiptId;
        if (result.Accepted) Complete(delivery, null, completedAt);
        else if (result.InvalidToken)
        {
            device.PushTokenEncrypted = null; device.PushTokenHash = null; device.PushTokenUpdatedAtUtc = completedAt;
            Dead(delivery, result.ErrorCode ?? "invalid_device_token", completedAt);
        }
        else if (result.Retryable) RetryOrDead(delivery, _options.MaxAttempts, result.ErrorCode ?? "provider_retryable_error", completedAt);
        else Dead(delivery, result.ErrorCode ?? "provider_rejected", completedAt);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void Complete(NotificationDelivery delivery, string? diagnostic, DateTimeOffset now)
    {
        delivery.Status = NotificationDeliveryStatuses.Accepted; delivery.CompletedAtUtc = now;
        delivery.LockedUntilUtc = null; delivery.LastError = diagnostic; delivery.UpdatedAtUtc = now;
    }
    private static void Suppress(NotificationDelivery delivery, string reason, DateTimeOffset now)
    {
        delivery.Status = NotificationDeliveryStatuses.Suppressed; delivery.CompletedAtUtc = now;
        delivery.LockedUntilUtc = null; delivery.LastError = reason; delivery.UpdatedAtUtc = now;
    }
    private static void Dead(NotificationDelivery delivery, string reason, DateTimeOffset now)
    {
        delivery.Status = NotificationDeliveryStatuses.Dead; delivery.CompletedAtUtc = now;
        delivery.LockedUntilUtc = null; delivery.LastError = reason[..Math.Min(240, reason.Length)]; delivery.UpdatedAtUtc = now;
    }
    private static void RetryOrDead(NotificationDelivery delivery, int maxAttempts, string reason, DateTimeOffset now)
    {
        delivery.LastError = reason[..Math.Min(240, reason.Length)]; delivery.LockedUntilUtc = null; delivery.UpdatedAtUtc = now;
        if (delivery.AttemptCount >= Math.Clamp(maxAttempts, 1, 20)) { delivery.Status = NotificationDeliveryStatuses.Dead; delivery.CompletedAtUtc = now; return; }
        var exponent = Math.Min(8, Math.Max(0, delivery.AttemptCount - 1));
        delivery.Status = NotificationDeliveryStatuses.Pending;
        delivery.AvailableAtUtc = now.AddSeconds(Math.Min(3600, 5 * Math.Pow(2, exponent)));
    }
}
