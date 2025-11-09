using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechTorio.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPageViewTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PageViews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PageUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    PageType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: true),
                    SellerId = table.Column<Guid>(type: "uuid", nullable: true),
                    VisitorId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Referrer = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageViews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PageViews_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_PageType",
                table: "PageViews",
                column: "PageType");

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_PageUrl_VisitorId_ViewedAt",
                table: "PageViews",
                columns: new[] { "PageUrl", "VisitorId", "ViewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_ProductId",
                table: "PageViews",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_SellerId",
                table: "PageViews",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_ViewedAt",
                table: "PageViews",
                column: "ViewedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PageViews_VisitorId",
                table: "PageViews",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PageViews");
        }
    }
}
