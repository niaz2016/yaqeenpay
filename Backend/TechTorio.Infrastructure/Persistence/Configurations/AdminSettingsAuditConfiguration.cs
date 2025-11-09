using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;

namespace TechTorio.Infrastructure.Persistence.Configurations;

public class AdminSettingsAuditConfiguration : IEntityTypeConfiguration<AdminSettingsAudit>
{
    public void Configure(EntityTypeBuilder<AdminSettingsAudit> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.SettingKey)
            .IsRequired()
            .HasMaxLength(200);
            
        builder.Property(x => x.Category)
            .IsRequired()
            .HasConversion<int>();
            
        builder.Property(x => x.OldValue)
            .HasColumnType("text");
            
        builder.Property(x => x.NewValue)
            .HasColumnType("text");
            
        builder.Property(x => x.ChangeType)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(x => x.ChangedAt)
            .IsRequired()
            .HasDefaultValueSql("CURRENT_TIMESTAMP AT TIME ZONE 'UTC'");
            
        builder.Property(x => x.ChangedByUserId)
            .IsRequired();
            
        builder.Property(x => x.IpAddress)
            .HasMaxLength(45); // IPv6 max length
            
        builder.Property(x => x.UserAgent)
            .HasMaxLength(500);
            
        builder.Property(x => x.Notes)
            .HasMaxLength(1000);
            
        // Indexes
        builder.HasIndex(x => x.SettingKey)
            .HasDatabaseName("IX_AdminSettingsAudit_SettingKey");
            
        builder.HasIndex(x => x.Category)
            .HasDatabaseName("IX_AdminSettingsAudit_Category");
            
        builder.HasIndex(x => x.ChangedByUserId)
            .HasDatabaseName("IX_AdminSettingsAudit_ChangedByUserId");
            
        builder.HasIndex(x => x.ChangedAt)
            .HasDatabaseName("IX_AdminSettingsAudit_ChangedAt");
            
        builder.HasIndex(x => new { x.SettingKey, x.ChangedAt })
            .HasDatabaseName("IX_AdminSettingsAudit_SettingKey_ChangedAt");
            
        // Relationships
        builder.HasOne(x => x.ChangedByUser)
            .WithMany()
            .HasForeignKey(x => x.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}