using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PendingModelSync : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "business_analytics_events",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SubjectType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: true),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_analytics_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_business_analytics_events_AspNetUsers_ActorUserId",
                        column: x => x.ActorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_business_analytics_events_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_milestones",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    AchievedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsSelfReported = table.Column<bool>(type: "boolean", nullable: false),
                    Visibility = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_milestones", x => x.Id);
                    table.CheckConstraint("CK_business_milestones_visibility", "\"Visibility\" IN ('public','private')");
                    table.ForeignKey(
                        name: "FK_business_milestones_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_milestones_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_opportunities",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Budget = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_opportunities", x => x.Id);
                    table.CheckConstraint("CK_business_opportunities_status", "\"Status\" IN ('open','closed')");
                    table.ForeignKey(
                        name: "FK_business_opportunities_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_opportunities_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_reviews",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    OwnerResponse = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OwnerRespondedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    OwnerRespondedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_reviews", x => x.Id);
                    table.CheckConstraint("CK_business_reviews_rating", "\"Rating\" BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_business_reviews_status", "\"Status\" IN ('published','hidden','reported')");
                    table.ForeignKey(
                        name: "FK_business_reviews_AspNetUsers_OwnerRespondedByUserId",
                        column: x => x.OwnerRespondedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_business_reviews_AspNetUsers_ReviewerUserId",
                        column: x => x.ReviewerUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_reviews_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_business_analytics_events_ActorUserId",
                schema: "public",
                table: "business_analytics_events",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_analytics_events_BusinessId_CreatedAtUtc",
                schema: "public",
                table: "business_analytics_events",
                columns: new[] { "BusinessId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_analytics_events_BusinessId_EventType_CreatedAtUtc",
                schema: "public",
                table: "business_analytics_events",
                columns: new[] { "BusinessId", "EventType", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_milestones_BusinessId_Visibility_AchievedAtUtc",
                schema: "public",
                table: "business_milestones",
                columns: new[] { "BusinessId", "Visibility", "AchievedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_milestones_CreatedByUserId",
                schema: "public",
                table: "business_milestones",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_opportunities_BusinessId_CreatedAtUtc",
                schema: "public",
                table: "business_opportunities",
                columns: new[] { "BusinessId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_opportunities_CreatedByUserId",
                schema: "public",
                table: "business_opportunities",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_opportunities_Status_ExpiresAtUtc_Category",
                schema: "public",
                table: "business_opportunities",
                columns: new[] { "Status", "ExpiresAtUtc", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_business_reviews_BusinessId_Status_CreatedAtUtc",
                schema: "public",
                table: "business_reviews",
                columns: new[] { "BusinessId", "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_business_reviews_OwnerRespondedByUserId",
                schema: "public",
                table: "business_reviews",
                column: "OwnerRespondedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_business_reviews_ReviewerUserId",
                schema: "public",
                table: "business_reviews",
                column: "ReviewerUserId");

            migrationBuilder.CreateIndex(
                name: "UX_business_reviews_one_per_user",
                schema: "public",
                table: "business_reviews",
                columns: new[] { "BusinessId", "ReviewerUserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "business_analytics_events",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_milestones",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_opportunities",
                schema: "public");

            migrationBuilder.DropTable(
                name: "business_reviews",
                schema: "public");
        }
    }
}
