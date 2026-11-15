using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizConnect.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Stage7Notifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "BusinessTeamActivity",
                schema: "public",
                table: "user_notification_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Comments",
                schema: "public",
                table: "user_notification_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "Likes",
                schema: "public",
                table: "user_notification_preferences",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PushTokenEncrypted",
                schema: "public",
                table: "user_devices",
                type: "character varying(1024)",
                maxLength: 1024,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PushTokenHash",
                schema: "public",
                table: "user_devices",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PushTokenUpdatedAtUtc",
                schema: "public",
                table: "user_devices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "user_notifications",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Body = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    TargetType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TargetId = table.Column<Guid>(type: "uuid", nullable: true),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: true),
                    PostId = table.Column<Guid>(type: "uuid", nullable: true),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CatalogItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    InAppVisible = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReadAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DismissedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_notifications", x => x.Id);
                    table.CheckConstraint("CK_user_notifications_body", "length(\"Title\") BETWEEN 1 AND 120 AND length(\"Body\") BETWEEN 1 AND 240");
                    table.CheckConstraint("CK_user_notifications_target_type", "length(\"TargetType\") BETWEEN 1 AND 40");
                    table.CheckConstraint("CK_user_notifications_type", "length(\"Type\") BETWEEN 1 AND 40");
                    table.ForeignKey(
                        name: "FK_user_notifications_AspNetUsers_ActorUserId",
                        column: x => x.ActorUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_notifications_AspNetUsers_RecipientUserId",
                        column: x => x.RecipientUserId,
                        principalSchema: "public",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "notification_deliveries",
                schema: "public",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    NotificationId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeviceId = table.Column<Guid>(type: "uuid", nullable: true),
                    Channel = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false),
                    AvailableAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LockedUntilUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ProviderReceiptId = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastError = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification_deliveries", x => x.Id);
                    table.CheckConstraint("CK_notification_deliveries_attempts", "\"AttemptCount\" >= 0");
                    table.CheckConstraint("CK_notification_deliveries_channel", "\"Channel\" IN ('realtime','push')");
                    table.CheckConstraint("CK_notification_deliveries_status", "\"Status\" IN ('pending','processing','accepted','suppressed','dead')");
                    table.ForeignKey(
                        name: "FK_notification_deliveries_user_devices_DeviceId",
                        column: x => x.DeviceId,
                        principalSchema: "public",
                        principalTable: "user_devices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_notification_deliveries_user_notifications_NotificationId",
                        column: x => x.NotificationId,
                        principalSchema: "public",
                        principalTable: "user_notifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "UX_user_devices_push_token_hash",
                schema: "public",
                table: "user_devices",
                column: "PushTokenHash",
                unique: true,
                filter: "\"PushTokenHash\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_notification_deliveries_DeviceId",
                schema: "public",
                table: "notification_deliveries",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_notification_deliveries_dispatch",
                schema: "public",
                table: "notification_deliveries",
                columns: new[] { "Status", "AvailableAtUtc", "LockedUntilUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_notification_deliveries_NotificationId",
                schema: "public",
                table: "notification_deliveries",
                column: "NotificationId");

            migrationBuilder.CreateIndex(
                name: "UX_notification_deliveries_idempotency",
                schema: "public",
                table: "notification_deliveries",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_ActorUserId",
                schema: "public",
                table: "user_notifications",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_inbox",
                schema: "public",
                table: "user_notifications",
                columns: new[] { "RecipientUserId", "InAppVisible", "DismissedAtUtc", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_unread",
                schema: "public",
                table: "user_notifications",
                columns: new[] { "RecipientUserId", "ReadAtUtc" });

            migrationBuilder.CreateIndex(
                name: "UX_user_notifications_recipient_event",
                schema: "public",
                table: "user_notifications",
                columns: new[] { "RecipientUserId", "IdempotencyKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notification_deliveries",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_notifications",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "UX_user_devices_push_token_hash",
                schema: "public",
                table: "user_devices");

            migrationBuilder.DropColumn(
                name: "BusinessTeamActivity",
                schema: "public",
                table: "user_notification_preferences");

            migrationBuilder.DropColumn(
                name: "Comments",
                schema: "public",
                table: "user_notification_preferences");

            migrationBuilder.DropColumn(
                name: "Likes",
                schema: "public",
                table: "user_notification_preferences");

            migrationBuilder.DropColumn(
                name: "PushTokenEncrypted",
                schema: "public",
                table: "user_devices");

            migrationBuilder.DropColumn(
                name: "PushTokenHash",
                schema: "public",
                table: "user_devices");

            migrationBuilder.DropColumn(
                name: "PushTokenUpdatedAtUtc",
                schema: "public",
                table: "user_devices");
        }
    }
}
