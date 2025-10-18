using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class RatingConfiguration : IEntityTypeConfiguration<Rating>
{
    public void Configure(EntityTypeBuilder<Rating> builder)
    {
        builder.HasKey(r => r.Id);

        // Configure auditable properties
        builder.ConfigureAuditableProperties();

        // Required properties
        builder.Property(r => r.OrderId)
            .IsRequired();

        builder.Property(r => r.ReviewerId)
            .IsRequired();

        builder.Property(r => r.ReviewerName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.ReviewerRole)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.RevieweeId)
            .IsRequired();

        builder.Property(r => r.RevieweeName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.RevieweeRole)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(r => r.Score)
            .IsRequired();

        builder.Property(r => r.Comment)
            .HasMaxLength(500);

        builder.Property(r => r.Category)
            .HasMaxLength(50);

        builder.Property(r => r.IsVerified)
            .IsRequired()
            .HasDefaultValue(false);

        // Unique constraint: One rating per order per reviewer
        builder.HasIndex(r => new { r.OrderId, r.ReviewerId })
            .IsUnique()
            .HasDatabaseName("IX_Ratings_OrderId_ReviewerId_Unique");

        // Performance indexes
        builder.HasIndex(r => r.RevieweeId)
            .HasDatabaseName("IX_Ratings_RevieweeId");

        builder.HasIndex(r => r.ReviewerId)
            .HasDatabaseName("IX_Ratings_ReviewerId");

        builder.HasIndex(r => r.CreatedAt)
            .HasDatabaseName("IX_Ratings_CreatedAt");

        builder.HasIndex(r => new { r.RevieweeId, r.CreatedAt })
            .HasDatabaseName("IX_Ratings_RevieweeId_CreatedAt");

        builder.HasIndex(r => r.Score)
            .HasDatabaseName("IX_Ratings_Score");

        // Relationships
        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Reviewer)
            .WithMany()
            .HasForeignKey(r => r.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Reviewee)
            .WithMany()
            .HasForeignKey(r => r.RevieweeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Table name
        builder.ToTable("Ratings");
    }
}
