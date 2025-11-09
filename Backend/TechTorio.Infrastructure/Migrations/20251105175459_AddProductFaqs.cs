using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechTorio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductFaqs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Faqs",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Faqs",
                table: "Products");
        }
    }
}
