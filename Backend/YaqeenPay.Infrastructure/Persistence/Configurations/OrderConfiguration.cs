using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        builder.Property(o => o.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(o => o.Description)
            .HasMaxLength(2000);

        // Configure value objects
        builder.OwnsOne(o => o.Amount, a =>
        {
            a.Property(m => m.Amount)
                .HasColumnName("Amount")
                .IsRequired();

            a.Property(m => m.Currency)
                .HasColumnName("Currency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.OwnsOne(o => o.DeclaredValue, d =>
        {
            d.Property(m => m.Amount)
                .HasColumnName("DeclaredValue")
                .IsRequired();

            d.Property(m => m.Currency)
                .HasColumnName("DeclaredValueCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        // Configure relationships
        builder.HasOne(o => o.Buyer)
            .WithMany()
            .HasForeignKey(o => o.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Seller)
            .WithMany()
            .HasForeignKey(o => o.SellerId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Configure one-to-one relationship with Escrow
        builder.HasOne(o => o.Escrow)
            .WithOne(e => e.Order)
            .HasForeignKey<Order>(o => o.EscrowId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}