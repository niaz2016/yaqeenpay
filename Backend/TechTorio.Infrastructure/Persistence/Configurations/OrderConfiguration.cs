using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Persistence.Configurations;

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

        // Configure ImageUrls as JSON column
        builder.Property(o => o.ImageUrls)
            .HasConversion(
                v => string.Join(';', v),
                v => v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList())
            .HasColumnName("ImageUrls")
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c == null ? new List<string>() : c.ToList()));

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

        // Configure FrozenAmount as nullable owned entity
        builder.OwnsOne(o => o.FrozenAmount, fa =>
        {
            fa.Property(m => m.Amount)
                .HasColumnName("FrozenAmount")
                .HasColumnType("decimal(18,2)"); // Remove IsRequired since this is nullable

            fa.Property(m => m.Currency)
                .HasColumnName("FrozenAmountCurrency")
                .HasMaxLength(3);
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