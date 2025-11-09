using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechTorio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceTrackingToPageView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Browser",
                table: "PageViews",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeviceType",
                table: "PageViews",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OperatingSystem",
                table: "PageViews",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Browser",
                table: "PageViews");

            migrationBuilder.DropColumn(
                name: "DeviceType",
                table: "PageViews");

            migrationBuilder.DropColumn(
                name: "OperatingSystem",
                table: "PageViews");
        }
    }
}
