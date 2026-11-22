using Mabiz.Domain.Businesses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mabiz.Infrastructure.Persistence;

public sealed class PostShareConfiguration : IEntityTypeConfiguration<PostShare>
{
    public void Configure(EntityTypeBuilder<PostShare> entity)
    {
        entity.ToTable("post_shares");
        entity.HasKey(x => x.Id);
        entity.HasIndex(x => new { x.PostId, x.SharedByUserId }).IsUnique();
        entity.HasIndex(x => new { x.SharedByUserId, x.CreatedAtUtc });
        entity.HasOne<Post>().WithMany().HasForeignKey(x => x.PostId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<MabizUser>().WithMany().HasForeignKey(x => x.SharedByUserId).OnDelete(DeleteBehavior.Cascade);
    }
}