using Mabiz.Domain.Businesses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mabiz.Infrastructure.Persistence;

public sealed class StoryConfiguration : IEntityTypeConfiguration<Story>
{
    public void Configure(EntityTypeBuilder<Story> entity)
    {
        entity.ToTable("stories", table => table.HasCheckConstraint("CK_stories_audience", "\"Audience\" IN ('public','followers')"));
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Text).HasMaxLength(500).IsRequired();
        entity.Property(x => x.MediaType).HasMaxLength(16);
        entity.Property(x => x.MediaUrl).HasMaxLength(2048);
        entity.Property(x => x.AltText).HasMaxLength(500);
        entity.Property(x => x.Audience).HasMaxLength(16).IsRequired();
        entity.HasIndex(x => new { x.AuthorUserId, x.ExpiresAtUtc });
        entity.HasIndex(x => x.ExpiresAtUtc);
        entity.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class StoryReplyConfiguration : IEntityTypeConfiguration<StoryReply>
{
    public void Configure(EntityTypeBuilder<StoryReply> entity)
    {
        entity.ToTable("story_replies");
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Text).HasMaxLength(1000).IsRequired();
        entity.HasIndex(x => new { x.StoryId, x.CreatedAtUtc });
        entity.HasOne<Story>().WithMany().HasForeignKey(x => x.StoryId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.Cascade);
    }
}