using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations;

public class SettingsAuditConfiguration : IEntityTypeConfiguration<SettingsAudit>
{
    public void Configure(EntityTypeBuilder<SettingsAudit> builder)
    {
        builder.HasKey(x => x.Id);
        
        builder.Property(x => x.UserId)
            .IsRequired();
            
        builder.Property(x => x.Category)
            .IsRequired()
            .HasMaxLength(50);
            
        builder.Property(x => x.SettingKey)
            .IsRequired()
            .HasMaxLength(100);
            
        builder.Property(x => x.OldValue)
            .HasColumnType("text");
            
        builder.Property(x => x.NewValue)
            .HasColumnType("text");
            
        builder.Property(x => x.ChangedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW()");
            
        builder.Property(x => x.ChangedBy)
            .IsRequired();
            
        builder.Property(x => x.IpAddress)
            .HasMaxLength(45); // IPv6 length
            
        builder.Property(x => x.UserAgent)
            .HasMaxLength(500);
            
        // Indexes
        builder.HasIndex(x => x.UserId)
            .HasDatabaseName("IX_SettingsAudit_UserId");
            
        builder.HasIndex(x => x.ChangedAt)
            .HasDatabaseName("IX_SettingsAudit_ChangedAt");
            
        builder.HasIndex(x => new { x.UserId, x.Category, x.ChangedAt })
            .HasDatabaseName("IX_SettingsAudit_UserId_Category_ChangedAt");
            
        // Relationships
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasOne(x => x.ChangedByUser)
            .WithMany()
            .HasForeignKey(x => x.ChangedBy)
            .OnDelete(DeleteBehavior.Restrict);
    }
}