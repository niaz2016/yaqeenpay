using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Persistence.Configurations;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.HasKey(oi => oi.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        builder.Property(oi => oi.ProductName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(oi => oi.ProductSku)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(oi => oi.ProductDescription)
            .HasMaxLength(5000);

        builder.Property(oi => oi.ProductImageUrl)
            .HasMaxLength(500);

        // Configure value objects
        builder.OwnsOne(oi => oi.UnitPrice, unitPrice =>
        {
            unitPrice.Property(m => m.Amount)
                .HasColumnName("UnitPrice")
                .HasPrecision(18, 2)
                .IsRequired();

            unitPrice.Property(m => m.Currency)
                .HasColumnName("UnitPriceCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.OwnsOne(oi => oi.TotalPrice, totalPrice =>
        {
            totalPrice.Property(m => m.Amount)
                .HasColumnName("TotalPrice")
                .HasPrecision(18, 2)
                .IsRequired();

            totalPrice.Property(m => m.Currency)
                .HasColumnName("TotalPriceCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        // Relationships
        builder.HasOne(oi => oi.Order)
            .WithMany()
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(oi => oi.Product)
            .WithMany(p => p.OrderItems)
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(oi => oi.OrderId);
        builder.HasIndex(oi => oi.ProductId);
    }
}