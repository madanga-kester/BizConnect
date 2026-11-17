using Mabiz.Domain.Businesses;
using Microsoft.EntityFrameworkCore;

namespace Mabiz.Infrastructure.Persistence;

internal static class Stage8Model
{
    public static void Configure(ModelBuilder builder)
    {
        builder.Entity<BusinessReview>(e =>
        {
            e.ToTable("business_reviews", t => { t.HasCheckConstraint("CK_business_reviews_rating", "\"Rating\" BETWEEN 1 AND 5"); t.HasCheckConstraint("CK_business_reviews_status", "\"Status\" IN ('published','hidden','reported')"); });
            e.HasKey(x => x.Id); e.Property(x => x.Comment).HasMaxLength(2000).IsRequired(); e.Property(x => x.OwnerResponse).HasMaxLength(2000); e.Property(x => x.Status).HasMaxLength(16).IsRequired();
            e.HasIndex(x => new { x.BusinessId, x.ReviewerUserId }).IsUnique().HasDatabaseName("UX_business_reviews_one_per_user"); e.HasIndex(x => new { x.BusinessId, x.Status, x.CreatedAtUtc });
            e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade); e.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.ReviewerUserId).OnDelete(DeleteBehavior.Restrict); e.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.OwnerRespondedByUserId).OnDelete(DeleteBehavior.SetNull);
        });
        builder.Entity<BusinessMilestone>(e =>
        {
            e.ToTable("business_milestones", t => t.HasCheckConstraint("CK_business_milestones_visibility", "\"Visibility\" IN ('public','private')")); e.HasKey(x => x.Id); e.Property(x => x.Title).HasMaxLength(160).IsRequired(); e.Property(x => x.Description).HasMaxLength(2000); e.Property(x => x.Visibility).HasMaxLength(16).IsRequired(); e.HasIndex(x => new { x.BusinessId, x.Visibility, x.AchievedAtUtc }); e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade); e.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessOpportunity>(e =>
        {
            e.ToTable("business_opportunities", t => t.HasCheckConstraint("CK_business_opportunities_status", "\"Status\" IN ('open','closed')")); e.HasKey(x => x.Id); e.Property(x => x.Title).HasMaxLength(180).IsRequired(); e.Property(x => x.Description).HasMaxLength(4000).IsRequired(); e.Property(x => x.Category).HasMaxLength(80).IsRequired(); e.Property(x => x.Currency).HasMaxLength(3).IsRequired(); e.Property(x => x.Budget).HasPrecision(18, 2); e.Property(x => x.Status).HasMaxLength(16).IsRequired(); e.HasIndex(x => new { x.Status, x.ExpiresAtUtc, x.Category }); e.HasIndex(x => new { x.BusinessId, x.CreatedAtUtc }); e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade); e.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
        builder.Entity<BusinessAnalyticsEvent>(e =>
        {
            e.ToTable("business_analytics_events"); e.HasKey(x => x.Id); e.Property(x => x.EventType).HasMaxLength(80).IsRequired(); e.Property(x => x.SubjectType).HasMaxLength(40); e.Property(x => x.MetadataJson).HasColumnType("jsonb"); e.HasIndex(x => new { x.BusinessId, x.EventType, x.CreatedAtUtc }); e.HasIndex(x => new { x.BusinessId, x.CreatedAtUtc }); e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade); e.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
