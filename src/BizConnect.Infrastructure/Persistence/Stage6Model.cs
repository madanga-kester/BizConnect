using BizConnect.Domain.Accounts;
using BizConnect.Domain.Businesses;
using BizConnect.Domain.Catalogue;
using BizConnect.Domain.Messaging;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Persistence;

internal static class Stage6Model
{
    public static void Configure(ModelBuilder b)
    {
        b.Entity<Conversation>(e =>
        {
            e.ToTable("conversations", t =>
            {
                t.HasCheckConstraint("CK_conversations_kind", "\"Kind\" IN ('direct','business')");
                t.HasCheckConstraint("CK_conversations_shape", "(\"Kind\" = 'business' AND \"BusinessId\" IS NOT NULL AND \"DirectUserLowId\" IS NULL AND \"DirectUserHighId\" IS NULL) OR (\"Kind\" = 'direct' AND \"BusinessId\" IS NULL AND \"CatalogItemId\" IS NULL AND \"DirectUserLowId\" IS NOT NULL AND \"DirectUserHighId\" IS NOT NULL AND \"DirectUserLowId\" <> \"DirectUserHighId\")");
                t.HasCheckConstraint("CK_conversations_block_state", "(\"IsBlocked\" = false AND \"BlockedByUserId\" IS NULL AND \"BlockedAtUtc\" IS NULL) OR (\"IsBlocked\" = true AND \"BlockedByUserId\" IS NOT NULL AND \"BlockedAtUtc\" IS NOT NULL)");
            });
            e.HasKey(x => x.Id);
            e.Property(x => x.Kind).HasMaxLength(16).IsRequired();
            e.Property(x => x.CatalogueTitleSnapshot).HasMaxLength(160);
            e.Property(x => x.LastMessagePreview).HasMaxLength(240).IsRequired();
            e.HasIndex(x => new { x.DirectUserLowId, x.DirectUserHighId }).IsUnique().HasFilter("\"Kind\" = 'direct'").HasDatabaseName("UX_conversations_direct_pair");
            e.HasIndex(x => new { x.BusinessId, x.CreatedByUserId, x.CatalogItemId }).IsUnique().HasFilter("\"Kind\" = 'business' AND \"CatalogItemId\" IS NOT NULL").HasDatabaseName("UX_conversations_business_item");
            e.HasIndex(x => new { x.BusinessId, x.CreatedByUserId }).IsUnique().HasFilter("\"Kind\" = 'business' AND \"CatalogItemId\" IS NULL").HasDatabaseName("UX_conversations_business_general");
            e.HasIndex(x => new { x.BusinessId, x.LastMessageAtUtc, x.Id });
            e.HasIndex(x => new { x.CreatedByUserId, x.LastMessageAtUtc, x.Id });
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<CatalogItem>().WithMany().HasForeignKey(x => x.CatalogItemId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.DirectUserLowId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.DirectUserHighId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.BlockedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ConversationParticipant>(e =>
        {
            e.ToTable("conversation_participants", t =>
                t.HasCheckConstraint("CK_conversation_participants_kind", "\"Kind\" IN ('direct','buyer','business_agent')"));
            e.HasKey(x => x.Id);
            e.Property(x => x.Kind).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.ConversationId, x.UserId }).IsUnique();
            e.HasIndex(x => new { x.UserId, x.ArchivedAtUtc, x.ConversationId });
            e.HasOne<Conversation>().WithMany().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ConversationMessage>(e =>
        {
            e.ToTable("conversation_messages", t =>
            {
                t.HasCheckConstraint("CK_conversation_messages_text", "char_length(trim(\"Text\")) BETWEEN 1 AND 5000");
                t.HasCheckConstraint("CK_conversation_messages_client_id", "\"ClientMessageId\" <> '00000000-0000-0000-0000-000000000000'");
            });
            e.HasKey(x => x.Id);
            e.Property(x => x.Text).HasMaxLength(5000).IsRequired();
            e.HasIndex(x => new { x.ConversationId, x.CreatedAtUtc, x.Id });
            e.HasIndex(x => new { x.ConversationId, x.SenderUserId, x.ClientMessageId }).IsUnique();
            e.HasOne<Conversation>().WithMany().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.SenderUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
