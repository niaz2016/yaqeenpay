using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Persistence.Configurations;

public class PageViewConfiguration : IEntityTypeConfiguration<PageView>
{
    public void Configure(EntityTypeBuilder<PageView> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PageUrl)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(p => p.PageType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.VisitorId)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.IpAddress)
            .HasMaxLength(50);

        builder.Property(p => p.UserAgent)
            .HasMaxLength(500);

        builder.Property(p => p.Referrer)
            .HasMaxLength(2000);

        builder.Property(p => p.ViewedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(p => p.Product)
            .WithMany()
            .HasForeignKey(p => p.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes for better performance
        builder.HasIndex(p => p.PageType);
        builder.HasIndex(p => p.ProductId);
        builder.HasIndex(p => p.SellerId);
        builder.HasIndex(p => p.VisitorId);
        builder.HasIndex(p => p.ViewedAt);
        builder.HasIndex(p => new { p.PageUrl, p.VisitorId, p.ViewedAt });
    }
}
