using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YaqeenPay.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentAndFrozenAmountSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "FrozenBalance",
                table: "Wallets",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "FrozenBalanceCurrency",
                table: "Wallets",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "FrozenAmount",
                table: "Orders",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FrozenAmountCurrency",
                table: "Orders",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAmountFrozen",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDate",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FrozenBalance",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "FrozenBalanceCurrency",
                table: "Wallets");

            migrationBuilder.DropColumn(
                name: "FrozenAmount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "FrozenAmountCurrency",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "IsAmountFrozen",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "Orders");
        }
    }
}
