using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Persistence.Configurations;

public class RatingStatsConfiguration : IEntityTypeConfiguration<RatingStats>
{
    public void Configure(EntityTypeBuilder<RatingStats> builder)
    {
        builder.HasKey(rs => rs.Id);

        // Required properties
        builder.Property(rs => rs.UserId)
            .IsRequired();

        builder.Property(rs => rs.AverageRating)
            .IsRequired()
            .HasPrecision(3, 2); // e.g., 4.75

        builder.Property(rs => rs.TotalRatings)
            .IsRequired()
            .HasDefaultValue(0);

        // Distribution properties
        builder.Property(rs => rs.FiveStarCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.FourStarCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.ThreeStarCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.TwoStarCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.OneStarCount)
            .IsRequired()
            .HasDefaultValue(0);

        // Category average properties
        builder.Property(rs => rs.CommunicationAvg)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.ReliabilityAvg)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.QualityAvg)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.SpeedAvg)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.OverallAvg)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        // Role-based stats properties
        builder.Property(rs => rs.AsBuyerAverage)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.AsBuyerCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.AsSellerAverage)
            .IsRequired()
            .HasPrecision(3, 2)
            .HasDefaultValue(0);

        builder.Property(rs => rs.AsSellerCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(rs => rs.UpdatedAt)
            .IsRequired();

        // Unique constraint: One stats record per user
        builder.HasIndex(rs => rs.UserId)
            .IsUnique()
            .HasDatabaseName("IX_RatingStats_UserId_Unique");

        // Performance indexes
        builder.HasIndex(rs => rs.AverageRating)
            .HasDatabaseName("IX_RatingStats_AverageRating");

        builder.HasIndex(rs => new { rs.AverageRating, rs.TotalRatings })
            .HasDatabaseName("IX_RatingStats_AverageRating_TotalRatings");

        // Relationship
        builder.HasOne(rs => rs.User)
            .WithMany()
            .HasForeignKey(rs => rs.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Table name
        builder.ToTable("RatingStats");
    }
}
