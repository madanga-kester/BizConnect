using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMenuBackend : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AccountDataExportRequests",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    DownloadTokenProtected = table.Column<string>(type: "character varying(4096)", maxLength: 4096, nullable: true),
                    RequestedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountDataExportRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AccountDeletionRequests",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RequestedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConfirmedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ScheduledDeletionAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CanceledAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountDeletionRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuActivityEvents",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    SubjectType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    SubjectId = table.Column<Guid>(type: "uuid", nullable: true),
                    MetadataJson = table.Column<string>(type: "character varying(10000)", maxLength: 10000, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuActivityEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MenuSettings",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TextSize = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    HighContrast = table.Column<bool>(type: "boolean", nullable: false),
                    ProfileVisibility = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    MessagePermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StoryReplyPermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CommentPermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TagPermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    MentionPermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SharingPermission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    AllowPostResharing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AllowStorySharing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    AllowExternalSharing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MenuSettings", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "post_shares",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_shares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_post_shares_AspNetUsers_SharedByUserId",
                        column: x => x.SharedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_post_shares_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "post_tags",
                schema: "public",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaggedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TaggedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_tags", x => new { x.PostId, x.TaggedUserId });
                    table.ForeignKey(
                        name: "FK_post_tags_AspNetUsers_TaggedByUserId",
                        column: x => x.TaggedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_post_tags_AspNetUsers_TaggedUserId",
                        column: x => x.TaggedUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_post_tags_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SavedContent",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    SavedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedContent", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "stories",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MediaType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    MediaUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    AltText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Audience = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stories", x => x.Id);
                    table.CheckConstraint("CK_stories_audience", "\"Audience\" IN ('public','followers')");
                    table.ForeignKey(
                        name: "FK_stories_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    YearlyPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SupportTickets",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Subject = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Message = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTickets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserSubscriptions",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    BillingCycle = table.Column<int>(type: "integer", nullable: false),
                    CurrentPeriodEndsAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CanceledAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Provider = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    ProviderSubscriptionId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSubscriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "story_replies",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_story_replies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_story_replies_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_story_replies_stories_StoryId",
                        column: x => x.StoryId,
                        principalSchema: "public",
                        principalTable: "stories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AccountDataExportRequests_UserId_RequestedAtUtc",
                schema: "public",
                table: "AccountDataExportRequests",
                columns: new[] { "UserId", "RequestedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AccountDeletionRequests_UserId_Status",
                schema: "public",
                table: "AccountDeletionRequests",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_MenuActivityEvents_UserId_CreatedAtUtc",
                schema: "public",
                table: "MenuActivityEvents",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_post_shares_PostId_SharedByUserId",
                schema: "public",
                table: "post_shares",
                columns: new[] { "PostId", "SharedByUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_post_shares_SharedByUserId_CreatedAtUtc",
                schema: "public",
                table: "post_shares",
                columns: new[] { "SharedByUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_post_tags_TaggedByUserId",
                schema: "public",
                table: "post_tags",
                column: "TaggedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_post_tags_TaggedUserId_CreatedAtUtc",
                schema: "public",
                table: "post_tags",
                columns: new[] { "TaggedUserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_SavedContent_UserId_ContentId_Kind",
                schema: "public",
                table: "SavedContent",
                columns: new[] { "UserId", "ContentId", "Kind" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedContent_UserId_SavedAtUtc",
                schema: "public",
                table: "SavedContent",
                columns: new[] { "UserId", "SavedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_stories_AuthorUserId_ExpiresAtUtc",
                schema: "public",
                table: "stories",
                columns: new[] { "AuthorUserId", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_stories_ExpiresAtUtc",
                schema: "public",
                table: "stories",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_story_replies_AuthorUserId",
                schema: "public",
                table: "story_replies",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_story_replies_StoryId_CreatedAtUtc",
                schema: "public",
                table: "story_replies",
                columns: new[] { "StoryId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_Code",
                schema: "public",
                table: "SubscriptionPlans",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_UserId_CreatedAtUtc",
                schema: "public",
                table: "SupportTickets",
                columns: new[] { "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_UserSubscriptions_ProviderSubscriptionId",
                schema: "public",
                table: "UserSubscriptions",
                column: "ProviderSubscriptionId",
                unique: true,
                filter: "\"ProviderSubscriptionId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserSubscriptions_UserId_Status",
                schema: "public",
                table: "UserSubscriptions",
                columns: new[] { "UserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountDataExportRequests",
                schema: "public");

            migrationBuilder.DropTable(
                name: "AccountDeletionRequests",
                schema: "public");

            migrationBuilder.DropTable(
                name: "MenuActivityEvents",
                schema: "public");

            migrationBuilder.DropTable(
                name: "MenuSettings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "post_shares",
                schema: "public");

            migrationBuilder.DropTable(
                name: "post_tags",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SavedContent",
                schema: "public");

            migrationBuilder.DropTable(
                name: "story_replies",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans",
                schema: "public");

            migrationBuilder.DropTable(
                name: "SupportTickets",
                schema: "public");

            migrationBuilder.DropTable(
                name: "UserSubscriptions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "stories",
                schema: "public");
        }
    }
}
