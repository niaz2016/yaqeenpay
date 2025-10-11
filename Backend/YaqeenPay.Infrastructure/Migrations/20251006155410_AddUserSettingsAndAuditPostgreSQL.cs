using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YaqeenPay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSettingsAndAuditPostgreSQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SettingsAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SettingKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    OldValue = table.Column<string>(type: "text", nullable: true),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    ChangedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SettingsAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SettingsAudits_AspNetUsers_ChangedBy",
                        column: x => x.ChangedBy,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SettingsAudits_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    SettingsData = table.Column<string>(type: "jsonb", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSettings_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SettingsAudit_ChangedAt",
                table: "SettingsAudits",
                column: "ChangedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SettingsAudit_UserId",
                table: "SettingsAudits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SettingsAudit_UserId_Category_ChangedAt",
                table: "SettingsAudits",
                columns: new[] { "UserId", "Category", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SettingsAudits_ChangedBy",
                table: "SettingsAudits",
                column: "ChangedBy");

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId",
                table: "UserSettings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSettings_UserId_Category",
                table: "UserSettings",
                columns: new[] { "UserId", "Category" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SettingsAudits");

            migrationBuilder.DropTable(
                name: "UserSettings");
        }
    }
}
