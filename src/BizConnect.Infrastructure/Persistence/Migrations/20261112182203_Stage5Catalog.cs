using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizConnect.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Stage5Catalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "catalog_items",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Subcategory = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    PriceKsh = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    PriceNote = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    PriceNegotiable = table.Column<bool>(type: "boolean", nullable: false),
                    Sku = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    StockQuantity = table.Column<int>(type: "integer", nullable: true),
                    InStock = table.Column<bool>(type: "boolean", nullable: true),
                    Unit = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    AvailabilityStatus = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    LeadTimeDays = table.Column<int>(type: "integer", nullable: true),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: true),
                    ServiceAreas = table.Column<string[]>(type: "text[]", nullable: false),
                    VisitType = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    AttributesJson = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    PublishedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArchivedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_catalog_items", x => x.Id);
                    table.CheckConstraint("CK_catalog_items_availability", "\"AvailabilityStatus\" IN ('available','on_request','fully_booked','seasonal')");
                    table.CheckConstraint("CK_catalog_items_currency", "\"Currency\" = 'KES'");
                    table.CheckConstraint("CK_catalog_items_kind", "\"Kind\" IN ('product','service')");
                    table.CheckConstraint("CK_catalog_items_price", "\"PriceKsh\" IS NULL OR \"PriceKsh\" >= 0");
                    table.CheckConstraint("CK_catalog_items_product_fields", "\"Kind\" = 'service' OR (\"LeadTimeDays\" IS NULL AND \"DurationMinutes\" IS NULL AND \"VisitType\" IS NULL)");
                    table.CheckConstraint("CK_catalog_items_published_at", "\"Status\" <> 'published' OR \"PublishedAtUtc\" IS NOT NULL");
                    table.CheckConstraint("CK_catalog_items_status", "\"Status\" IN ('draft','published','archived')");
                    table.CheckConstraint("CK_catalog_items_stock_quantity", "\"StockQuantity\" IS NULL OR \"StockQuantity\" >= 0");
                    table.CheckConstraint("CK_catalog_items_visit_type", "\"VisitType\" IS NULL OR \"VisitType\" IN ('onsite','remote','hybrid')");
                    table.ForeignKey(
                        name: "FK_catalog_items_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_catalog_items_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "media_assets",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Sha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    WidthPx = table.Column<int>(type: "integer", nullable: true),
                    HeightPx = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DeletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_media_assets", x => x.Id);
                    table.CheckConstraint("CK_media_assets_provider", "\"Provider\" IN ('local','s3')");
                    table.CheckConstraint("CK_media_assets_size", "\"SizeBytes\" > 0");
                    table.CheckConstraint("CK_media_assets_status", "\"Status\" IN ('ready','deleted')");
                    table.ForeignKey(
                        name: "FK_media_assets_AspNetUsers_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_media_assets_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "catalog_item_media",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CatalogItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaAssetId = table.Column<Guid>(type: "uuid", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    AltText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_catalog_item_media", x => x.Id);
                    table.CheckConstraint("CK_catalog_item_media_sort", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_catalog_item_media_catalog_items_CatalogItemId",
                        column: x => x.CatalogItemId,
                        principalSchema: "public",
                        principalTable: "catalog_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_catalog_item_media_media_assets_MediaAssetId",
                        column: x => x.MediaAssetId,
                        principalSchema: "public",
                        principalTable: "media_assets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_catalog_item_media_CatalogItemId_SortOrder",
                schema: "public",
                table: "catalog_item_media",
                columns: new[] { "CatalogItemId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_catalog_item_media_MediaAssetId",
                schema: "public",
                table: "catalog_item_media",
                column: "MediaAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_catalog_items_BusinessId_Slug",
                schema: "public",
                table: "catalog_items",
                columns: new[] { "BusinessId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_catalog_items_BusinessId_Status_Kind_UpdatedAtUtc",
                schema: "public",
                table: "catalog_items",
                columns: new[] { "BusinessId", "Status", "Kind", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_catalog_items_CreatedByUserId",
                schema: "public",
                table: "catalog_items",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_catalog_items_Status_Category",
                schema: "public",
                table: "catalog_items",
                columns: new[] { "Status", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_catalog_items_Status_Kind_PublishedAtUtc_Id",
                schema: "public",
                table: "catalog_items",
                columns: new[] { "Status", "Kind", "PublishedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "UX_catalog_items_business_sku",
                schema: "public",
                table: "catalog_items",
                columns: new[] { "BusinessId", "Sku" },
                unique: true,
                filter: "\"Sku\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_media_assets_BusinessId_Sha256",
                schema: "public",
                table: "media_assets",
                columns: new[] { "BusinessId", "Sha256" });

            migrationBuilder.CreateIndex(
                name: "IX_media_assets_BusinessId_Status_CreatedAtUtc",
                schema: "public",
                table: "media_assets",
                columns: new[] { "BusinessId", "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_media_assets_StorageKey",
                schema: "public",
                table: "media_assets",
                column: "StorageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_media_assets_UploadedByUserId",
                schema: "public",
                table: "media_assets",
                column: "UploadedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "catalog_item_media",
                schema: "public");

            migrationBuilder.DropTable(
                name: "catalog_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "media_assets",
                schema: "public");
        }
    }
}
