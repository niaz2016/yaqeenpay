using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YaqeenPay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRatingSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Ratings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewerName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReviewerRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RevieweeId = table.Column<Guid>(type: "uuid", nullable: false),
                    RevieweeName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    RevieweeRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Score = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    Modified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ratings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ratings_AspNetUsers_RevieweeId",
                        column: x => x.RevieweeId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ratings_AspNetUsers_ReviewerId",
                        column: x => x.ReviewerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ratings_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RatingStats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    AverageRating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    TotalRatings = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    FiveStarCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    FourStarCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ThreeStarCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    TwoStarCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    OneStarCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CommunicationAvg = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    ReliabilityAvg = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    QualityAvg = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    SpeedAvg = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    OverallAvg = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    AsBuyerAverage = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    AsBuyerCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    AsSellerAverage = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    AsSellerCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RatingStats", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RatingStats_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_CreatedAt",
                table: "Ratings",
                column: "Created");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_OrderId_ReviewerId_Unique",
                table: "Ratings",
                columns: new[] { "OrderId", "ReviewerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RevieweeId",
                table: "Ratings",
                column: "RevieweeId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RevieweeId_CreatedAt",
                table: "Ratings",
                columns: new[] { "RevieweeId", "Created" });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_ReviewerId",
                table: "Ratings",
                column: "ReviewerId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_Score",
                table: "Ratings",
                column: "Score");

            migrationBuilder.CreateIndex(
                name: "IX_RatingStats_AverageRating",
                table: "RatingStats",
                column: "AverageRating");

            migrationBuilder.CreateIndex(
                name: "IX_RatingStats_AverageRating_TotalRatings",
                table: "RatingStats",
                columns: new[] { "AverageRating", "TotalRatings" });

            migrationBuilder.CreateIndex(
                name: "IX_RatingStats_UserId_Unique",
                table: "RatingStats",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Ratings");

            migrationBuilder.DropTable(
                name: "RatingStats");
        }
    }
}
