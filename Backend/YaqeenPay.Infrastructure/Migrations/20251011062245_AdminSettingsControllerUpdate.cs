using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YaqeenPay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AdminSettingsControllerUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UpdatedBy",
                table: "AdminSettingsAudits",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "AdminSettingsAudits");
        }
    }
}
