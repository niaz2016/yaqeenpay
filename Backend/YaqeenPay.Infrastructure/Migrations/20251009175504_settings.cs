using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YaqeenPay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class settings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AdminSettingsAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SettingKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    OldValue = table.Column<string>(type: "text", nullable: true),
                    NewValue = table.Column<string>(type: "text", nullable: true),
                    ChangeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'"),
                    ChangedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminSettingsAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdminSettingsAudits_AspNetUsers_ChangedByUserId",
                        column: x => x.ChangedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AdminSystemSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SettingKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SettingValue = table.Column<string>(type: "text", nullable: false),
                    DataType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "string"),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    IsEncrypted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsSensitive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DefaultValue = table.Column<string>(type: "text", nullable: true),
                    ValidationRules = table.Column<string>(type: "jsonb", nullable: true),
                    ModifiedByUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminSystemSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdminSystemSettings_AspNetUsers_ModifiedByUserId",
                        column: x => x.ModifiedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminSettingsAudit_Category",
                table: "AdminSettingsAudits",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSettingsAudit_ChangedAt",
                table: "AdminSettingsAudits",
                column: "ChangedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSettingsAudit_ChangedByUserId",
                table: "AdminSettingsAudits",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSettingsAudit_SettingKey",
                table: "AdminSettingsAudits",
                column: "SettingKey");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSettingsAudit_SettingKey_ChangedAt",
                table: "AdminSettingsAudits",
                columns: new[] { "SettingKey", "ChangedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminSystemSettings_Category",
                table: "AdminSystemSettings",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSystemSettings_Category_IsActive",
                table: "AdminSystemSettings",
                columns: new[] { "Category", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_AdminSystemSettings_IsActive",
                table: "AdminSystemSettings",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSystemSettings_ModifiedByUserId",
                table: "AdminSystemSettings",
                column: "ModifiedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSystemSettings_SettingKey",
                table: "AdminSystemSettings",
                column: "SettingKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminSettingsAudits");

            migrationBuilder.DropTable(
                name: "AdminSystemSettings");
        }
    }
}
