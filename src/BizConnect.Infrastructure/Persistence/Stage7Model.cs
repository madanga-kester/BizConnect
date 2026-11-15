using BizConnect.Domain.Accounts;
using BizConnect.Domain.Notifications;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Persistence;

internal static class Stage7Model
{
    public static void Configure(ModelBuilder builder)
    {
        builder.Entity<UserNotification>(entity =>
        {
            entity.ToTable("user_notifications", table =>
            {
                table.HasCheckConstraint("CK_user_notifications_type", "length(\"Type\") BETWEEN 1 AND 40");
                table.HasCheckConstraint("CK_user_notifications_target_type", "length(\"TargetType\") BETWEEN 1 AND 40");
                table.HasCheckConstraint("CK_user_notifications_body", "length(\"Title\") BETWEEN 1 AND 120 AND length(\"Body\") BETWEEN 1 AND 240");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Body).HasMaxLength(240).IsRequired();
            entity.Property(x => x.TargetType).HasMaxLength(40).IsRequired();
            entity.Property(x => x.IdempotencyKey).HasMaxLength(200).IsRequired();
            entity.HasIndex(x => new { x.RecipientUserId, x.IdempotencyKey }).IsUnique().HasDatabaseName("UX_user_notifications_recipient_event");
            entity.HasIndex(x => new { x.RecipientUserId, x.InAppVisible, x.DismissedAtUtc, x.CreatedAtUtc }).HasDatabaseName("IX_user_notifications_inbox");
            entity.HasIndex(x => new { x.RecipientUserId, x.ReadAtUtc }).HasDatabaseName("IX_user_notifications_unread");
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.RecipientUserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<NotificationDelivery>(entity =>
        {
            entity.ToTable("notification_deliveries", table =>
            {
                table.HasCheckConstraint("CK_notification_deliveries_channel", "\"Channel\" IN ('realtime','push')");
                table.HasCheckConstraint("CK_notification_deliveries_status", "\"Status\" IN ('pending','processing','accepted','suppressed','dead')");
                table.HasCheckConstraint("CK_notification_deliveries_attempts", "\"AttemptCount\" >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Channel).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(16).IsRequired();
            entity.Property(x => x.IdempotencyKey).HasMaxLength(240).IsRequired();
            entity.Property(x => x.LastError).HasMaxLength(240);
            entity.Property(x => x.ProviderReceiptId).HasMaxLength(120);
            entity.HasIndex(x => x.IdempotencyKey).IsUnique().HasDatabaseName("UX_notification_deliveries_idempotency");
            entity.HasIndex(x => new { x.Status, x.AvailableAtUtc, x.LockedUntilUtc }).HasDatabaseName("IX_notification_deliveries_dispatch");
            entity.HasOne<UserNotification>().WithMany().HasForeignKey(x => x.NotificationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<UserDevice>().WithMany().HasForeignKey(x => x.DeviceId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<UserNotificationPreferences>(entity =>
        {
            entity.Property(x => x.Likes).HasDefaultValue(true);
            entity.Property(x => x.Comments).HasDefaultValue(true);
            entity.Property(x => x.BusinessTeamActivity).HasDefaultValue(true);
        });

        builder.Entity<UserDevice>(entity =>
        {
            entity.Property(x => x.PushTokenEncrypted).HasMaxLength(1024);
            entity.Property(x => x.PushTokenHash).HasMaxLength(64);
            entity.HasIndex(x => x.PushTokenHash).IsUnique().HasFilter("\"PushTokenHash\" IS NOT NULL").HasDatabaseName("UX_user_devices_push_token_hash");
        });
    }
}
