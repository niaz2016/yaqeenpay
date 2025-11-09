using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;

namespace TechTorio.Infrastructure.Persistence.Configurations
{
    public class WalletTopupLockConfiguration : IEntityTypeConfiguration<WalletTopupLock>
    {
        public void Configure(EntityTypeBuilder<WalletTopupLock> builder)
        {
            builder.ToTable("WalletTopupLocks");
            
            builder.HasKey(x => x.Id);
            
            builder.Property(x => x.UserId)
                .IsRequired();
            
            builder.Property(x => x.LockedAt)
                .IsRequired();
            
            builder.Property(x => x.ExpiresAt)
                .IsRequired();
            
            builder.Property(x => x.Status)
                .HasConversion<string>()
                .IsRequired();
            
            builder.Property(x => x.TransactionReference)
                .HasMaxLength(100);
            
            // Configure the Money value object properly
            builder.OwnsOne(x => x.Amount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("Amount")
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();
                
                money.Property(m => m.Currency)
                    .HasColumnName("Currency")
                    .HasMaxLength(3)
                    .IsRequired();
            });
            
            // Configure relationship with User
            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Add indexes for performance
            builder.HasIndex(x => x.Status)
                .HasDatabaseName("IX_WalletTopupLocks_Status");
            
            builder.HasIndex(x => new { x.UserId, x.Status })
                .HasDatabaseName("IX_WalletTopupLocks_UserId_Status");
            
            builder.HasIndex(x => x.ExpiresAt)
                .HasDatabaseName("IX_WalletTopupLocks_ExpiresAt");
        }
    }
}