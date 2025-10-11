using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.HasKey(pi => pi.Id);
        
        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        builder.Property(pi => pi.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(pi => pi.AltText)
            .HasMaxLength(200);

        builder.Property(pi => pi.FileName)
            .HasMaxLength(200);

        builder.Property(pi => pi.ContentType)
            .HasMaxLength(100);

        // Relationship with Product
        builder.HasOne(pi => pi.Product)
            .WithMany(p => p.ProductImages)
            .HasForeignKey(pi => pi.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(pi => pi.ProductId);
        builder.HasIndex(pi => new { pi.ProductId, pi.IsPrimary });
    }
}