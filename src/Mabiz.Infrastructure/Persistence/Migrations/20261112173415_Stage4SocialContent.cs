using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Stage4SocialContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "business_follows",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_follows", x => new { x.UserId, x.BusinessId });
                    table.ForeignKey(
                        name: "FK_business_follows_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_business_follows_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "posts",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: true),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Audience = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Discoverable = table.Column<bool>(type: "boolean", nullable: false),
                    AllowComments = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    Text = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProductJson = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_posts", x => x.Id);
                    table.CheckConstraint("CK_posts_audience", "\"Audience\" IN ('public','followers','private')");
                    table.CheckConstraint("CK_posts_kind", "\"Kind\" IN ('text','image','video','product','announcement')");
                    table.CheckConstraint("CK_posts_text_length", "char_length(\"Text\") <= 5000");
                    table.ForeignKey(
                        name: "FK_posts_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_posts_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_blocks",
                schema: "public",
                columns: table => new
                {
                    BlockerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_blocks", x => new { x.BlockerUserId, x.BlockedUserId });
                    table.CheckConstraint("CK_user_blocks_not_self", "\"BlockerUserId\" <> \"BlockedUserId\"");
                    table.ForeignKey(
                        name: "FK_user_blocks_AspNetUsers_BlockedUserId",
                        column: x => x.BlockedUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_blocks_AspNetUsers_BlockerUserId",
                        column: x => x.BlockerUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_follows",
                schema: "public",
                columns: table => new
                {
                    FollowerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FollowedUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_follows", x => new { x.FollowerUserId, x.FollowedUserId });
                    table.CheckConstraint("CK_user_follows_not_self", "\"FollowerUserId\" <> \"FollowedUserId\"");
                    table.ForeignKey(
                        name: "FK_user_follows_AspNetUsers_FollowedUserId",
                        column: x => x.FollowedUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_follows_AspNetUsers_FollowerUserId",
                        column: x => x.FollowerUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "comments",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentCommentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_comments", x => x.Id);
                    table.CheckConstraint("CK_comments_not_self_parent", "\"ParentCommentId\" IS NULL OR \"ParentCommentId\" <> \"Id\"");
                    table.ForeignKey(
                        name: "FK_comments_AspNetUsers_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_comments_comments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalSchema: "public",
                        principalTable: "comments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_comments_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "hidden_posts",
                schema: "public",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hidden_posts", x => new { x.UserId, x.PostId });
                    table.ForeignKey(
                        name: "FK_hidden_posts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_hidden_posts_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "polls",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    Question = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ClosesAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_polls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_polls_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "post_likes",
                schema: "public",
                columns: table => new
                {
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_likes", x => new { x.PostId, x.UserId });
                    table.ForeignKey(
                        name: "FK_post_likes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_post_likes_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "post_media_references",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PostId = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaType = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    AltText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_post_media_references", x => x.Id);
                    table.CheckConstraint("CK_post_media_sort", "\"SortOrder\" >= 0");
                    table.ForeignKey(
                        name: "FK_post_media_references_posts_PostId",
                        column: x => x.PostId,
                        principalSchema: "public",
                        principalTable: "posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "poll_options",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PollId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_poll_options", x => x.Id);
                    table.UniqueConstraint("AK_poll_options_PollId_Id", x => new { x.PollId, x.Id });
                    table.ForeignKey(
                        name: "FK_poll_options_polls_PollId",
                        column: x => x.PollId,
                        principalSchema: "public",
                        principalTable: "polls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "poll_votes",
                schema: "public",
                columns: table => new
                {
                    PollId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_poll_votes", x => new { x.PollId, x.UserId });
                    table.ForeignKey(
                        name: "FK_poll_votes_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_poll_votes_poll_options_PollId_OptionId",
                        columns: x => new { x.PollId, x.OptionId },
                        principalSchema: "public",
                        principalTable: "poll_options",
                        principalColumns: new[] { "PollId", "Id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_poll_votes_polls_PollId",
                        column: x => x.PollId,
                        principalSchema: "public",
                        principalTable: "polls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_business_follows_BusinessId_CreatedAtUtc",
                schema: "public",
                table: "business_follows",
                columns: new[] { "BusinessId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_comments_AuthorUserId",
                schema: "public",
                table: "comments",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_comments_ParentCommentId_CreatedAtUtc_Id",
                schema: "public",
                table: "comments",
                columns: new[] { "ParentCommentId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_comments_PostId_CreatedAtUtc_Id",
                schema: "public",
                table: "comments",
                columns: new[] { "PostId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_hidden_posts_PostId_UserId",
                schema: "public",
                table: "hidden_posts",
                columns: new[] { "PostId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_poll_options_PollId_SortOrder",
                schema: "public",
                table: "poll_options",
                columns: new[] { "PollId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_poll_votes_PollId_OptionId",
                schema: "public",
                table: "poll_votes",
                columns: new[] { "PollId", "OptionId" });

            migrationBuilder.CreateIndex(
                name: "IX_poll_votes_UserId",
                schema: "public",
                table: "poll_votes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_polls_PostId",
                schema: "public",
                table: "polls",
                column: "PostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_post_likes_PostId_CreatedAtUtc",
                schema: "public",
                table: "post_likes",
                columns: new[] { "PostId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_post_likes_UserId",
                schema: "public",
                table: "post_likes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_post_media_references_PostId_SortOrder",
                schema: "public",
                table: "post_media_references",
                columns: new[] { "PostId", "SortOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_posts_Audience_Discoverable_CreatedAtUtc_Id",
                schema: "public",
                table: "posts",
                columns: new[] { "Audience", "Discoverable", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_posts_AuthorUserId_CreatedAtUtc_Id",
                schema: "public",
                table: "posts",
                columns: new[] { "AuthorUserId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_posts_BusinessId_CreatedAtUtc_Id",
                schema: "public",
                table: "posts",
                columns: new[] { "BusinessId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_posts_CreatedAtUtc_Id",
                schema: "public",
                table: "posts",
                columns: new[] { "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_user_blocks_BlockedUserId_BlockerUserId",
                schema: "public",
                table: "user_blocks",
                columns: new[] { "BlockedUserId", "BlockerUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_user_follows_FollowedUserId_CreatedAtUtc",
                schema: "public",
                table: "user_follows",
                columns: new[] { "FollowedUserId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "business_follows",
                schema: "public");

            migrationBuilder.DropTable(
                name: "comments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "hidden_posts",
                schema: "public");

            migrationBuilder.DropTable(
                name: "poll_votes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "post_likes",
                schema: "public");

            migrationBuilder.DropTable(
                name: "post_media_references",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_blocks",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_follows",
                schema: "public");

            migrationBuilder.DropTable(
                name: "poll_options",
                schema: "public");

            migrationBuilder.DropTable(
                name: "polls",
                schema: "public");

            migrationBuilder.DropTable(
                name: "posts",
                schema: "public");
        }
    }
}
