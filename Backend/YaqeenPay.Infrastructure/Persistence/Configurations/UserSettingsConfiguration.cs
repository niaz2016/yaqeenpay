using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.UserId)
            .IsRequired();
            
        builder.Property(x => x.Category)
            .IsRequired()
            .HasConversion<int>();
            
        builder.Property(x => x.SettingsData)
            .IsRequired()
            .HasColumnType("jsonb");
            
        // Indexes
        builder.HasIndex(x => new { x.UserId, x.Category })
            .IsUnique()
            .HasDatabaseName("IX_UserSettings_UserId_Category");
            
        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("IX_UserSettings_UserId");
            
        // Relationships
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Configure auditable entity properties
        builder.ConfigureAuditableProperties();
    }
}