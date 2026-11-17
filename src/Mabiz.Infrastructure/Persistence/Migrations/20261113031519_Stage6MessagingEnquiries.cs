using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mabiz.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Stage6MessagingEnquiries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "conversations",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: true),
                    CatalogItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    DirectUserLowId = table.Column<Guid>(type: "uuid", nullable: true),
                    DirectUserHighId = table.Column<Guid>(type: "uuid", nullable: true),
                    CatalogueTitleSnapshot = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastMessageAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastMessagePreview = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    IsBlocked = table.Column<bool>(type: "boolean", nullable: false),
                    BlockedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    BlockedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conversations", x => x.Id);
                    table.CheckConstraint("CK_conversations_block_state", "(\"IsBlocked\" = false AND \"BlockedByUserId\" IS NULL AND \"BlockedAtUtc\" IS NULL) OR (\"IsBlocked\" = true AND \"BlockedByUserId\" IS NOT NULL AND \"BlockedAtUtc\" IS NOT NULL)");
                    table.CheckConstraint("CK_conversations_kind", "\"Kind\" IN ('direct','business')");
                    table.CheckConstraint("CK_conversations_shape", "(\"Kind\" = 'business' AND \"BusinessId\" IS NOT NULL AND \"DirectUserLowId\" IS NULL AND \"DirectUserHighId\" IS NULL) OR (\"Kind\" = 'direct' AND \"BusinessId\" IS NULL AND \"CatalogItemId\" IS NULL AND \"DirectUserLowId\" IS NOT NULL AND \"DirectUserHighId\" IS NOT NULL AND \"DirectUserLowId\" <> \"DirectUserHighId\")");
                    table.ForeignKey(
                        name: "FK_conversations_AspNetUsers_BlockedByUserId",
                        column: x => x.BlockedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversations_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversations_AspNetUsers_DirectUserHighId",
                        column: x => x.DirectUserHighId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversations_AspNetUsers_DirectUserLowId",
                        column: x => x.DirectUserLowId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversations_businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalSchema: "public",
                        principalTable: "businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversations_catalog_items_CatalogItemId",
                        column: x => x.CatalogItemId,
                        principalSchema: "public",
                        principalTable: "catalog_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "conversation_messages",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientMessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conversation_messages", x => x.Id);
                    table.CheckConstraint("CK_conversation_messages_client_id", "\"ClientMessageId\" <> '00000000-0000-0000-0000-000000000000'");
                    table.CheckConstraint("CK_conversation_messages_text", "char_length(trim(\"Text\")) BETWEEN 1 AND 5000");
                    table.ForeignKey(
                        name: "FK_conversation_messages_AspNetUsers_SenderUserId",
                        column: x => x.SenderUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversation_messages_conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalSchema: "public",
                        principalTable: "conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "conversation_participants",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    JoinedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastDeliveredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastReadAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ArchivedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_conversation_participants", x => x.Id);
                    table.CheckConstraint("CK_conversation_participants_kind", "\"Kind\" IN ('direct','buyer','business_agent')");
                    table.ForeignKey(
                        name: "FK_conversation_participants_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_conversation_participants_conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalSchema: "public",
                        principalTable: "conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_conversation_messages_ConversationId_CreatedAtUtc_Id",
                schema: "public",
                table: "conversation_messages",
                columns: new[] { "ConversationId", "CreatedAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_conversation_messages_ConversationId_SenderUserId_ClientMes~",
                schema: "public",
                table: "conversation_messages",
                columns: new[] { "ConversationId", "SenderUserId", "ClientMessageId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_conversation_messages_SenderUserId",
                schema: "public",
                table: "conversation_messages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_conversation_participants_ConversationId_UserId",
                schema: "public",
                table: "conversation_participants",
                columns: new[] { "ConversationId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_conversation_participants_UserId_ArchivedAtUtc_Conversation~",
                schema: "public",
                table: "conversation_participants",
                columns: new[] { "UserId", "ArchivedAtUtc", "ConversationId" });

            migrationBuilder.CreateIndex(
                name: "IX_conversations_BlockedByUserId",
                schema: "public",
                table: "conversations",
                column: "BlockedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_conversations_BusinessId_LastMessageAtUtc_Id",
                schema: "public",
                table: "conversations",
                columns: new[] { "BusinessId", "LastMessageAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_conversations_CatalogItemId",
                schema: "public",
                table: "conversations",
                column: "CatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_conversations_CreatedByUserId_LastMessageAtUtc_Id",
                schema: "public",
                table: "conversations",
                columns: new[] { "CreatedByUserId", "LastMessageAtUtc", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_conversations_DirectUserHighId",
                schema: "public",
                table: "conversations",
                column: "DirectUserHighId");

            migrationBuilder.CreateIndex(
                name: "UX_conversations_business_general",
                schema: "public",
                table: "conversations",
                columns: new[] { "BusinessId", "CreatedByUserId" },
                unique: true,
                filter: "\"Kind\" = 'business' AND \"CatalogItemId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "UX_conversations_business_item",
                schema: "public",
                table: "conversations",
                columns: new[] { "BusinessId", "CreatedByUserId", "CatalogItemId" },
                unique: true,
                filter: "\"Kind\" = 'business' AND \"CatalogItemId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UX_conversations_direct_pair",
                schema: "public",
                table: "conversations",
                columns: new[] { "DirectUserLowId", "DirectUserHighId" },
                unique: true,
                filter: "\"Kind\" = 'direct'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "conversation_messages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "conversation_participants",
                schema: "public");

            migrationBuilder.DropTable(
                name: "conversations",
                schema: "public");
        }
    }
}
