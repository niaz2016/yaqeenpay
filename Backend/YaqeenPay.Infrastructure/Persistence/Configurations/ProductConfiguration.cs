using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .HasMaxLength(5000);

        builder.Property(p => p.ShortDescription)
            .HasMaxLength(500);

        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(p => p.Brand)
            .HasMaxLength(100);

        builder.Property(p => p.Model)
            .HasMaxLength(100);

        builder.Property(p => p.Color)
            .HasMaxLength(50);

        builder.Property(p => p.Size)
            .HasMaxLength(50);

        builder.Property(p => p.Material)
            .HasMaxLength(100);

        builder.Property(p => p.WeightUnit)
            .HasMaxLength(10);

        builder.Property(p => p.Dimensions)
            .HasMaxLength(200);

        // Configure value objects
        builder.OwnsOne(p => p.Price, price =>
        {
            price.Property(m => m.Amount)
                .HasColumnName("Price")
                .HasPrecision(18, 2)
                .IsRequired();

            price.Property(m => m.Currency)
                .HasColumnName("PriceCurrency")
                .HasMaxLength(3)
                .IsRequired();
        });

        builder.OwnsOne(p => p.DiscountPrice, discountPrice =>
        {
            discountPrice.Property(m => m.Amount)
                .HasColumnName("DiscountPrice")
                .HasPrecision(18, 2);

            discountPrice.Property(m => m.Currency)
                .HasColumnName("DiscountPriceCurrency")
                .HasMaxLength(3);
        });

        // Configure collections as JSON
        builder.Property(p => p.Tags)
            .HasConversion(
                v => string.Join(';', v),
                v => v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList())
            .HasColumnName("Tags")
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (c1, c2) => (c1 == null && c2 == null) || (c1 != null && c2 != null && c1.SequenceEqual(c2)),
                c => c == null ? 0 : c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => c == null ? new List<string>() : c.ToList()));

        builder.Property(p => p.Attributes)
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, new System.Text.Json.JsonSerializerOptions()),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(v, new System.Text.Json.JsonSerializerOptions()) ?? new Dictionary<string, string>())
            .HasColumnName("Attributes");

        // Relationships
        builder.HasOne(p => p.Seller)
            .WithMany()
            .HasForeignKey(p => p.SellerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes for better performance
        builder.HasIndex(p => p.Name);
        builder.HasIndex(p => p.Sku).IsUnique();
        builder.HasIndex(p => p.SellerId);
        builder.HasIndex(p => p.CategoryId);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.IsActive);
        builder.HasIndex(p => p.IsFeatured);
        builder.HasIndex(p => p.CreatedAt);
    }
}