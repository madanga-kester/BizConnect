using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessesTeamsAndOwnershipTransfers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "businesses",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    BusinessType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Subcategory = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Description = table.Column<string>(type: "character varying(280)", maxLength: 280, nullable: false),
                    About = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Founder = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    OriginStory = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    County = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Town = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Neighbourhood = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ServiceAreas = table.Column<string[]>(type: "text[]", nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Whatsapp = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    Email = table.Column<string>(type: "character varying(254)", maxLength: 254, nullable: true),
                    Website = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    PriceRange = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    OperatingHours = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SocialLinksJson = table.Column<string>(type: "jsonb", nullable: false),
                    Logo = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Cover = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    Visibility = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ArchivedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_businesses", x => x.Id);
                    table.CheckConstraint("CK_businesses_price_range", "\"PriceRange\" IN ('KSh','KSh KSh','KSh KSh KSh')");
                    table.CheckConstraint("CK_businesses_status", "\"Status\" IN ('active','archived')");
                    table.CheckConstraint("CK_businesses_type", "\"BusinessType\" IN ('products','services','hybrid')");
                    table.CheckConstraint("CK_businesses_visibility", "\"Visibility\" IN ('public','private')");
                    table.ForeignKey(
                        name: "FK_businesses_AspNetUsers_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "business_activity",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(48)", maxLength: 48, nullable: false),
                    Summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_activity", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_activity_AspNetUsers_ActorUserId",
                        column: x => x.ActorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_activity_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_invitations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RespondedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_invitations", x => x.Id);
                    table.CheckConstraint("CK_business_invitations_role", "\"Role\" IN ('Admin','Editor','Viewer')");
                    table.CheckConstraint("CK_business_invitations_status", "\"Status\" IN ('pending','accepted','declined','cancelled','expired')");
                    table.ForeignKey(
                        name: "FK_business_invitations_AspNetUsers_InvitedByUserId",
                        column: x => x.InvitedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_invitations_AspNetUsers_InvitedUserId",
                        column: x => x.InvitedUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_invitations_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_memberships",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    GrantedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    JoinedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_memberships", x => x.Id);
                    table.CheckConstraint("CK_business_memberships_role", "\"Role\" IN ('Owner','Admin','Editor','Viewer')");
                    table.ForeignKey(
                        name: "FK_business_memberships_AspNetUsers_GrantedByUserId",
                        column: x => x.GrantedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_memberships_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_memberships_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_ownership_transfers",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RespondedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_ownership_transfers", x => x.Id);
                    table.CheckConstraint("CK_business_ownership_transfers_status", "\"Status\" IN ('pending','accepted','declined','cancelled','expired')");
                    table.ForeignKey(
                        name: "FK_business_ownership_transfers_AspNetUsers_FromUserId",
                        column: x => x.FromUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_ownership_transfers_AspNetUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_ownership_transfers_AspNetUsers_ToUserId",
                        column: x => x.ToUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_ownership_transfers_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_business_activity_ActorUserId",
                schema: "public",
                table: "business_activity",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_activity_BusinessId_CreatedAtUtc",
                schema: "public",
                table: "business_activity",
                columns: new[] { "BusinessId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_invitations_InvitedByUserId",
                schema: "public",
                table: "business_invitations",
                column: "InvitedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_invitations_InvitedUserId_Status_ExpiresAtUtc",
                schema: "public",
                table: "business_invitations",
                columns: new[] { "InvitedUserId", "Status", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_business_invitations_pending_recipient",
                schema: "public",
                table: "business_invitations",
                columns: new[] { "BusinessId", "InvitedUserId" },
                unique: true,
                filter: "\"Status\" = 'pending'");

            migrationBuilder.CreateIndex(
                name: "IX_business_memberships_BusinessId_UserId",
                schema: "public",
                table: "business_memberships",
                columns: new[] { "BusinessId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_business_memberships_GrantedByUserId",
                schema: "public",
                table: "business_memberships",
                column: "GrantedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_memberships_UserId_RevokedAtUtc",
                schema: "public",
                table: "business_memberships",
                columns: new[] { "UserId", "RevokedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_business_memberships_one_active_owner",
                schema: "public",
                table: "business_memberships",
                column: "BusinessId",
                unique: true,
                filter: "\"Role\" = 'Owner' AND \"RevokedAtUtc\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_business_ownership_transfers_FromUserId",
                schema: "public",
                table: "business_ownership_transfers",
                column: "FromUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_ownership_transfers_RequestedByUserId",
                schema: "public",
                table: "business_ownership_transfers",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_ownership_transfers_ToUserId_Status_ExpiresAtUtc",
                schema: "public",
                table: "business_ownership_transfers",
                columns: new[] { "ToUserId", "Status", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_business_transfers_one_pending",
                schema: "public",
                table: "business_ownership_transfers",
                column: "BusinessId",
                unique: true,
                filter: "\"Status\" = 'pending'");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_County_Town_Category_Status",
                schema: "public",
                table: "businesses",
                columns: new[] { "County", "Town", "Category", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_businesses_OwnerUserId_Status_UpdatedAtUtc",
                schema: "public",
                table: "businesses",
                columns: new[] { "OwnerUserId", "Status", "UpdatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_businesses_Slug",
                schema: "public",
                table: "businesses",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "business_activity",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_invitations",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_memberships",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_ownership_transfers",
                schema: "public");

            migrationBuilder.DropTable(
                name: "businesses",
                schema: "public");
        }
    }
}
