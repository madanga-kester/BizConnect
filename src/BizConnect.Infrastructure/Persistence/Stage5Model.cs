using BizConnect.Domain.Businesses;
using BizConnect.Domain.Catalogue;
using Microsoft.EntityFrameworkCore;

namespace BizConnect.Infrastructure.Persistence;

/// <summary>Stage 5 catalogue and media mapping, kept in its own file so the Stage 2-4 mapping stays readable.</summary>
internal static class Stage5Model
{
    public static void Configure(ModelBuilder b)
    {
        b.Entity<CatalogItem>(e =>
        {
            e.ToTable("catalog_items", t =>
            {
                t.HasCheckConstraint("CK_catalog_items_kind", "\"Kind\" IN ('product','service')");
                t.HasCheckConstraint("CK_catalog_items_status", "\"Status\" IN ('draft','published','archived')");
                t.HasCheckConstraint("CK_catalog_items_availability", "\"AvailabilityStatus\" IN ('available','on_request','fully_booked','seasonal')");
                t.HasCheckConstraint("CK_catalog_items_visit_type", "\"VisitType\" IS NULL OR \"VisitType\" IN ('onsite','remote','hybrid')");
                t.HasCheckConstraint("CK_catalog_items_price", "\"PriceKsh\" IS NULL OR \"PriceKsh\" >= 0");
                t.HasCheckConstraint("CK_catalog_items_stock_quantity", "\"StockQuantity\" IS NULL OR \"StockQuantity\" >= 0");
                t.HasCheckConstraint("CK_catalog_items_currency", "\"Currency\" = 'KES'");
                t.HasCheckConstraint("CK_catalog_items_product_fields", "\"Kind\" = 'service' OR (\"LeadTimeDays\" IS NULL AND \"DurationMinutes\" IS NULL AND \"VisitType\" IS NULL)");
                t.HasCheckConstraint("CK_catalog_items_published_at", "\"Status\" <> 'published' OR \"PublishedAtUtc\" IS NOT NULL");
            });
            e.HasKey(x => x.Id);
            e.Property(x => x.Kind).HasMaxLength(16);
            e.Property(x => x.Title).HasMaxLength(120).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(160).IsRequired();
            e.Property(x => x.Description).HasMaxLength(2000).IsRequired();
            e.Property(x => x.Category).HasMaxLength(80).IsRequired();
            e.Property(x => x.Subcategory).HasMaxLength(80).IsRequired();
            e.Property(x => x.PriceKsh).HasPrecision(12, 2);
            e.Property(x => x.PriceNote).HasMaxLength(200).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            e.Property(x => x.Sku).HasMaxLength(64);
            e.Property(x => x.Unit).HasMaxLength(32);
            e.Property(x => x.AvailabilityStatus).HasMaxLength(16).IsRequired();
            e.Property(x => x.VisitType).HasMaxLength(8);
            e.Property(x => x.ServiceAreas).HasColumnType("text[]").IsRequired();
            e.Property(x => x.Status).HasMaxLength(16).IsRequired();
            e.Property(x => x.AttributesJson).HasColumnType("jsonb").IsRequired();
            e.Property(x => x.Version).IsConcurrencyToken();

            e.HasIndex(x => new { x.BusinessId, x.Slug }).IsUnique();
            e.HasIndex(x => new { x.BusinessId, x.Sku }).IsUnique().HasFilter("\"Sku\" IS NOT NULL").HasDatabaseName("UX_catalog_items_business_sku");
            e.HasIndex(x => new { x.BusinessId, x.Status, x.Kind, x.UpdatedAtUtc });
            e.HasIndex(x => new { x.Status, x.Kind, x.PublishedAtUtc, x.Id });
            e.HasIndex(x => new { x.Status, x.Category });

            e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<CatalogItemMedia>(e =>
        {
            e.ToTable("catalog_item_media", t => t.HasCheckConstraint("CK_catalog_item_media_sort", "\"SortOrder\" >= 0"));
            e.HasKey(x => x.Id);
            e.Property(x => x.AltText).HasMaxLength(500).IsRequired();
            e.HasIndex(x => new { x.CatalogItemId, x.SortOrder }).IsUnique();
            e.HasIndex(x => x.MediaAssetId);
            e.HasOne<CatalogItem>().WithMany(x => x.Media).HasForeignKey(x => x.CatalogItemId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<MediaAsset>().WithMany().HasForeignKey(x => x.MediaAssetId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<MediaAsset>(e =>
        {
            e.ToTable("media_assets", t =>
            {
                t.HasCheckConstraint("CK_media_assets_provider", "\"Provider\" IN ('local','s3')");
                t.HasCheckConstraint("CK_media_assets_status", "\"Status\" IN ('ready','deleted')");
                t.HasCheckConstraint("CK_media_assets_size", "\"SizeBytes\" > 0");
            });
            e.HasKey(x => x.Id);
            e.Property(x => x.Provider).HasMaxLength(16).IsRequired();
            e.Property(x => x.StorageKey).HasMaxLength(512).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(64).IsRequired();
            e.Property(x => x.Sha256).HasMaxLength(64).IsRequired();
            e.Property(x => x.Status).HasMaxLength(16).IsRequired();
            e.Property(x => x.Version).IsConcurrencyToken();
            e.HasIndex(x => x.StorageKey).IsUnique();
            e.HasIndex(x => new { x.BusinessId, x.Status, x.CreatedAtUtc });
            e.HasIndex(x => new { x.BusinessId, x.Sha256 });
            e.HasOne<Business>().WithMany().HasForeignKey(x => x.BusinessId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<BizConnectUser>().WithMany().HasForeignKey(x => x.UploadedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
