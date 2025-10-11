using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class AdminSystemSettingsConfiguration : IEntityTypeConfiguration<AdminSystemSettings>
{
    public void Configure(EntityTypeBuilder<AdminSystemSettings> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.SettingKey)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(x => x.SettingValue)
            .IsRequired()
            .HasColumnType("text");
            
        builder.Property(x => x.DataType)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("string");
            
        builder.Property(x => x.Category)
            .IsRequired()
            .HasConversion<int>();
            
        builder.Property(x => x.Description)
            .HasMaxLength(500);
            
        builder.Property(x => x.IsActive)
            .HasDefaultValue(true);
            
        builder.Property(x => x.IsEncrypted)
            .HasDefaultValue(false);
            
        builder.Property(x => x.IsSensitive)
            .HasDefaultValue(false);
            
        builder.Property(x => x.DefaultValue)
            .HasColumnType("text");
            
        builder.Property(x => x.ValidationRules)
            .HasColumnType("jsonb");
            
        // Indexes
        builder.HasIndex(x => x.SettingKey)
            .IsUnique()
            .HasDatabaseName("IX_AdminSystemSettings_SettingKey");
            
        builder.HasIndex(x => x.Category)
            .HasDatabaseName("IX_AdminSystemSettings_Category");
            
        builder.HasIndex(x => x.IsActive)
            .HasDatabaseName("IX_AdminSystemSettings_IsActive");
            
        builder.HasIndex(x => new { x.Category, x.IsActive })
            .HasDatabaseName("IX_AdminSystemSettings_Category_IsActive");
            
        // Relationships
        builder.HasOne(x => x.ModifiedByUser)
            .WithMany()
            .HasForeignKey(x => x.ModifiedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
            
        // Configure auditable entity properties
        builder.ConfigureAuditableProperties();
    }
}