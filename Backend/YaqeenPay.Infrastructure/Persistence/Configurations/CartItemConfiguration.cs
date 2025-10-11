using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.HasKey(ci => ci.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        // Configure value object
        builder.OwnsOne(ci => ci.UnitPrice, price =>
        {
            price.Property(m => m.Amount)
                .HasColumnName("UnitPrice")
                .HasPrecision(18, 2)
                .IsRequired();

            price.Property(m => m.Currency)
                .HasColumnName("UnitPriceCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        // Relationships
        builder.HasOne(ci => ci.User)
            .WithMany()
            .HasForeignKey(ci => ci.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ci => ci.Product)
            .WithMany(p => p.CartItems)
            .HasForeignKey(ci => ci.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint - one product per user in cart
        builder.HasIndex(ci => new { ci.UserId, ci.ProductId }).IsUnique();

        // Additional indexes
        builder.HasIndex(ci => ci.UserId);
        builder.HasIndex(ci => ci.AddedDate);
    }
}