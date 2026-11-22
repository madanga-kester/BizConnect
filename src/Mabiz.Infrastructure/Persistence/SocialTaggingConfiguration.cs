using Mabiz.Domain.Businesses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mabiz.Infrastructure.Persistence;

public sealed class PostTagConfiguration : IEntityTypeConfiguration<PostTag>
{
    public void Configure(EntityTypeBuilder<PostTag> entity)
    {
        entity.ToTable("post_tags");
        entity.HasKey(x => new { x.PostId, x.TaggedUserId });
        entity.HasIndex(x => new { x.TaggedUserId, x.CreatedAtUtc });
        entity.HasOne<Post>().WithMany().HasForeignKey(x => x.PostId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.TaggedUserId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.TaggedByUserId).OnDelete(DeleteBehavior.Cascade);
    }
}