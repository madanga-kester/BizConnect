using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mabiz.Domain.Menu;

namespace Mabiz.Infrastructure.Menu;

public sealed class MenuSettingsConfiguration : IEntityTypeConfiguration<MenuSettings>
{
    public void Configure(EntityTypeBuilder<MenuSettings> b)
    {
        b.ToTable("MenuSettings"); b.HasKey(x => x.UserId); b.Property(x => x.TextSize).HasMaxLength(32).IsRequired(); b.Property(x => x.ProfileVisibility).HasMaxLength(32).IsRequired(); b.Property(x => x.MessagePermission).HasMaxLength(32).IsRequired(); b.Property(x => x.StoryReplyPermission).HasMaxLength(32).IsRequired(); b.Property(x => x.CommentPermission).HasMaxLength(32).IsRequired(); b.Property(x => x.TagPermission).HasMaxLength(32).IsRequired(); b.Property(x => x.MentionPermission).HasMaxLength(32).IsRequired(); b.Property(x => x.SharingPermission).HasMaxLength(32).IsRequired(); b.Property(x => x.AllowPostResharing).HasDefaultValue(true); b.Property(x => x.AllowStorySharing).HasDefaultValue(true); b.Property(x => x.AllowExternalSharing).HasDefaultValue(true);
    }
}
public sealed class AccountDataExportRequestConfiguration : IEntityTypeConfiguration<AccountDataExportRequest>
{
    public void Configure(EntityTypeBuilder<AccountDataExportRequest> b) { b.ToTable("AccountDataExportRequests"); b.HasKey(x => x.Id); b.Property(x => x.Status).HasMaxLength(32).IsRequired(); b.Property(x => x.DownloadTokenProtected).HasMaxLength(4096); b.HasIndex(x => new { x.UserId, x.RequestedAtUtc }); }
}
public sealed class AccountDeletionRequestConfiguration : IEntityTypeConfiguration<AccountDeletionRequest>
{
    public void Configure(EntityTypeBuilder<AccountDeletionRequest> b) { b.ToTable("AccountDeletionRequests"); b.HasKey(x => x.Id); b.Property(x => x.Status).HasMaxLength(32).IsRequired(); b.HasIndex(x => new { x.UserId, x.Status }); }
}
public sealed class SupportTicketConfiguration : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> b) { b.ToTable("SupportTickets"); b.HasKey(x => x.Id); b.Property(x => x.Subject).HasMaxLength(160).IsRequired(); b.Property(x => x.Message).HasMaxLength(5000).IsRequired(); b.HasIndex(x => new { x.UserId, x.CreatedAtUtc }); }
}
public sealed class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> b) { b.ToTable("SubscriptionPlans"); b.HasKey(x => x.Id); b.HasIndex(x => x.Code).IsUnique(); b.Property(x => x.Code).HasMaxLength(64).IsRequired(); b.Property(x => x.DisplayName).HasMaxLength(160).IsRequired(); b.Property(x => x.Currency).HasMaxLength(3).IsRequired(); b.Property(x => x.MonthlyPrice).HasPrecision(18, 2); b.Property(x => x.YearlyPrice).HasPrecision(18, 2); }
}
public sealed class UserSubscriptionConfiguration : IEntityTypeConfiguration<UserSubscription>
{
    public void Configure(EntityTypeBuilder<UserSubscription> b) { b.ToTable("UserSubscriptions"); b.HasKey(x => x.Id); b.Property(x => x.Provider).HasMaxLength(64); b.Property(x => x.ProviderSubscriptionId).HasMaxLength(256); b.HasIndex(x => new { x.UserId, x.Status }); b.HasIndex(x => x.ProviderSubscriptionId).IsUnique().HasFilter("\"ProviderSubscriptionId\" IS NOT NULL"); }
}
public sealed class SavedContentConfiguration : IEntityTypeConfiguration<SavedContent> { public void Configure(EntityTypeBuilder<SavedContent> b) { b.ToTable("SavedContent"); b.HasKey(x => x.Id); b.HasIndex(x => new { x.UserId, x.ContentId, x.Kind }).IsUnique(); b.HasIndex(x => new { x.UserId, x.SavedAtUtc }); } }
public sealed class MenuActivityEventConfiguration : IEntityTypeConfiguration<MenuActivityEvent> { public void Configure(EntityTypeBuilder<MenuActivityEvent> b) { b.ToTable("MenuActivityEvents"); b.HasKey(x => x.Id); b.Property(x => x.EventType).HasMaxLength(80).IsRequired(); b.Property(x => x.SubjectType).HasMaxLength(80); b.Property(x => x.MetadataJson).HasMaxLength(10000); b.HasIndex(x => new { x.UserId, x.CreatedAtUtc }); } }
