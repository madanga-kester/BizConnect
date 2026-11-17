using BizConnect.Domain.Accounts;
using BizConnect.Domain.Businesses;
using BizConnect.Domain.Catalogue;
using BizConnect.Domain.Notifications;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Persistence;

public sealed class BizConnectUser : IdentityUser<Guid>
{
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? LastSignedInAtUtc { get; set; }
}

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityDbContext<BizConnectUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<UserPreferences> UserPreferences => Set<UserPreferences>();
    public DbSet<UserNotificationPreferences> UserNotificationPreferences => Set<UserNotificationPreferences>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<EmailVerificationChallenge> EmailVerificationChallenges => Set<EmailVerificationChallenge>();
    public DbSet<PhoneVerificationChallenge> PhoneVerificationChallenges => Set<PhoneVerificationChallenge>();
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();
        public DbSet<PasswordHistoryEntry> PasswordHistoryEntries => Set<PasswordHistoryEntry>();
    public DbSet<UserDevice> UserDevices => Set<UserDevice>();
    public DbSet<Business> Businesses => Set<Business>();
    public DbSet<BusinessMembership> BusinessMemberships => Set<BusinessMembership>();
    public DbSet<BusinessInvitation> BusinessInvitations => Set<BusinessInvitation>();
    public DbSet<BusinessOwnershipTransfer> BusinessOwnershipTransfers => Set<BusinessOwnershipTransfer>();
    public DbSet<BusinessActivity> BusinessActivities => Set<BusinessActivity>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostMediaReference> PostMediaReferences => Set<PostMediaReference>();
    public DbSet<PostLike> PostLikes => Set<PostLike>();
    public DbSet<SocialComment> Comments => Set<SocialComment>();
    public DbSet<SocialPoll> Polls => Set<SocialPoll>();
    public DbSet<PollOption> PollOptions => Set<PollOption>();
    public DbSet<PollVote> PollVotes => Set<PollVote>();
    public DbSet<UserFollow> UserFollows => Set<UserFollow>();
    public DbSet<BusinessFollow> BusinessFollows => Set<BusinessFollow>();
    public DbSet<UserBlock> UserBlocks => Set<UserBlock>();
    public DbSet<HiddenPost> HiddenPosts => Set<HiddenPost>();
    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<CatalogItemMedia> CatalogItemMediaLinks => Set<CatalogItemMedia>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<BizConnect.Domain.Messaging.Conversation> Conversations => Set<BizConnect.Domain.Messaging.Conversation>();
    public DbSet<BizConnect.Domain.Messaging.ConversationParticipant> ConversationParticipants => Set<BizConnect.Domain.Messaging.ConversationParticipant>();
    public DbSet<BizConnect.Domain.Messaging.ConversationMessage> ConversationMessages => Set<BizConnect.Domain.Messaging.ConversationMessage>();
    public DbSet<UserNotification> Notifications => Set<UserNotification>();
        public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();
    public DbSet<BusinessReview> BusinessReviews => Set<BusinessReview>();
    public DbSet<BusinessMilestone> BusinessMilestones => Set<BusinessMilestone>();
    public DbSet<BusinessOpportunity> BusinessOpportunities => Set<BusinessOpportunity>();
    public DbSet<BusinessAnalyticsEvent> BusinessAnalyticsEvents => Set<BusinessAnalyticsEvent>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.HasDefaultSchema("public");
        builder.Entity<BizConnectUser>(entity =>
        {
            entity.ToTable("AspNetUsers");
            entity.Property(x => x.CreatedAtUtc).HasColumnType("timestamp with time zone");
            entity.Property(x => x.LastSignedInAtUtc).HasColumnType("timestamp with time zone");
            entity.HasIndex(x => x.NormalizedEmail).IsUnique().HasDatabaseName("EmailIndex");
            entity.HasIndex(x => x.PhoneNumber).IsUnique().HasFilter("\"PhoneNumber\" IS NOT NULL").HasDatabaseName("PhoneNumberIndex");
        });
        builder.Entity<IdentityRole<Guid>>().ToTable("AspNetRoles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("AspNetUserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("AspNetUserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("AspNetUserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("AspNetRoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("AspNetUserTokens");

        builder.Entity<UserProfile>(entity =>
        {
            entity.ToTable("user_profiles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Username).HasMaxLength(30).IsRequired();
            entity.Property(x => x.UsernameNormalized).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Bio).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Avatar).HasMaxLength(2048);
            entity.Property(x => x.County).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Town).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Neighbourhood).HasMaxLength(100);
            entity.Property(x => x.Interests).HasColumnType("text[]").IsRequired();
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasIndex(x => x.UsernameNormalized).IsUnique();
            entity.HasOne<BizConnectUser>().WithOne().HasForeignKey<UserProfile>(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<UserPreferences>(entity =>
        {
            entity.ToTable("user_preferences");
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.Locale).HasMaxLength(10).IsRequired();
            entity.Property(x => x.TimeZone).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Theme).HasMaxLength(16).IsRequired();
            entity.HasOne<BizConnectUser>().WithOne().HasForeignKey<UserPreferences>(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<UserNotificationPreferences>(entity =>
        {
            entity.ToTable("user_notification_preferences");
            entity.HasKey(x => x.UserId);
            entity.HasOne<BizConnectUser>().WithOne().HasForeignKey<UserNotificationPreferences>(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<UserSession>(entity =>
        {
            entity.ToTable("user_sessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DeviceLabel).HasMaxLength(100);
            entity.Property(x => x.UserAgent).HasMaxLength(512);
            entity.HasIndex(x => new { x.UserId, x.ExpiresAtUtc });
            entity.HasIndex(x => x.RevokedAtUtc);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => x.TokenHash).IsUnique();
            entity.HasIndex(x => new { x.SessionId, x.ExpiresAtUtc });
            entity.HasOne<UserSession>().WithMany(x => x.RefreshTokens).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<RefreshToken>().WithMany().HasForeignKey(x => x.ReplacedByTokenId).OnDelete(DeleteBehavior.SetNull);
        });
        builder.Entity<EmailVerificationChallenge>(entity =>
        {
            entity.ToTable("email_verification_challenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(254).IsRequired();
            entity.Property(x => x.Purpose).HasMaxLength(32).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.ExpiresAtUtc });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PhoneVerificationChallenge>(entity =>
        {
            entity.ToTable("phone_verification_challenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNumber).HasMaxLength(32).IsRequired();
            entity.Property(x => x.Purpose).HasMaxLength(32).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.ExpiresAtUtc });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<PasswordResetRequest>(entity =>
        {
            entity.ToTable("password_reset_requests");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CodeHash).HasMaxLength(64).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.ExpiresAtUtc });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        
        builder.Entity<PasswordHistoryEntry>(entity =>
        {
            entity.ToTable("password_history_entries");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
            entity.HasIndex(x => new { x.UserId, x.CreatedAtUtc });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserDevice>(entity =>
        {
            entity.ToTable("user_devices");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DeviceIdentifier).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Platform).HasMaxLength(16).IsRequired();
            entity.Property(x => x.DeviceName).HasMaxLength(100);
            entity.HasIndex(x => new { x.UserId, x.DeviceIdentifier }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.RevokedAtUtc });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<Business>(entity =>
        {
            entity.ToTable("businesses", table =>
            {
                table.HasCheckConstraint("CK_businesses_type", "\"BusinessType\" IN ('products','services','hybrid')");
                table.HasCheckConstraint("CK_businesses_visibility", "\"Visibility\" IN ('public','private')");
                table.HasCheckConstraint("CK_businesses_status", "\"Status\" IN ('active','archived')");
                table.HasCheckConstraint("CK_businesses_price_range", "\"PriceRange\" IN ('KSh','KSh KSh','KSh KSh KSh')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Slug).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.BusinessType).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Subcategory).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(280).IsRequired();
            entity.Property(x => x.About).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.Founder).HasMaxLength(120).IsRequired();
            entity.Property(x => x.OriginStory).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.County).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Town).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Neighbourhood).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ServiceAreas).HasColumnType("text[]").IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(32);
            entity.Property(x => x.Whatsapp).HasMaxLength(32);
            entity.Property(x => x.Email).HasMaxLength(254);
            entity.Property(x => x.Website).HasMaxLength(2048);
            entity.Property(x => x.PriceRange).HasMaxLength(16).IsRequired();
            entity.Property(x => x.OperatingHours).HasMaxLength(500).IsRequired();
            entity.Property(x => x.SocialLinksJson).HasColumnType("jsonb").IsRequired();
            entity.Property(x => x.Logo).HasMaxLength(2048);
            entity.Property(x => x.Cover).HasMaxLength(2048);
            entity.Property(x => x.Visibility).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.HasIndex(x => x.Slug).IsUnique();
            entity.HasIndex(x => new { x.OwnerUserId, x.Status, x.UpdatedAtUtc });
            entity.HasIndex(x => new { x.County, x.Town, x.Category, x.Status });
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessMembership>(entity =>
        {
            entity.ToTable("business_memberships", table => table.HasCheckConstraint("CK_business_memberships_role", "\"Role\" IN ('Owner','Admin','Editor','Viewer')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Role).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.HasIndex(x => new { x.BusinessId, x.UserId }).IsUnique();
            entity.HasIndex(x => new { x.UserId, x.RevokedAtUtc });
            entity.HasIndex(x => x.BusinessId).IsUnique().HasFilter("\"Role\" = 'Owner' AND \"RevokedAtUtc\" IS NULL").HasDatabaseName("UX_business_memberships_one_active_owner");
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.GrantedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessInvitation>(entity =>
        {
            entity.ToTable("business_invitations", table =>
            {
                table.HasCheckConstraint("CK_business_invitations_role", "\"Role\" IN ('Admin','Editor','Viewer')");
                table.HasCheckConstraint("CK_business_invitations_status", "\"Status\" IN ('pending','accepted','declined','cancelled','expired')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Role).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.HasIndex(x => new { x.BusinessId, x.InvitedUserId }).IsUnique().HasFilter("\"Status\" = 'pending'").HasDatabaseName("UX_business_invitations_pending_recipient");
            entity.HasIndex(x => new { x.InvitedUserId, x.Status, x.ExpiresAtUtc });
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.InvitedUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessOwnershipTransfer>(entity =>
        {
            entity.ToTable("business_ownership_transfers", table => table.HasCheckConstraint("CK_business_ownership_transfers_status", "\"Status\" IN ('pending','accepted','declined','cancelled','expired')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(16).IsRequired();
            entity.Property(x => x.Version).IsConcurrencyToken();
            entity.HasIndex(x => x.BusinessId).IsUnique().HasFilter("\"Status\" = 'pending'").HasDatabaseName("UX_business_transfers_one_pending");
            entity.HasIndex(x => new { x.ToUserId, x.Status, x.ExpiresAtUtc });
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.FromUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.ToUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessActivity>(entity =>
        {
            entity.ToTable("business_activity");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(48).IsRequired();
            entity.Property(x => x.Summary).HasMaxLength(500).IsRequired();
            entity.Property(x => x.MetadataJson).HasColumnType("jsonb");
            entity.HasIndex(x => new { x.BusinessId, x.CreatedAtUtc });
            entity.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.Restrict);
        });
        Stage4Model.Configure(builder);
        Stage5Model.Configure(builder);
        Stage6Model.Configure(builder);
        Stage7Model.Configure(builder);
        Stage8Model.Configure(builder);
    }
}
