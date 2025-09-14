using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations
{
    public class TopUpConfiguration : IEntityTypeConfiguration<TopUp>
    {
        public void Configure(EntityTypeBuilder<TopUp> builder)
        {
            builder.HasKey(t => t.Id);
            
            builder.Property(t => t.UserId)
                .IsRequired();
            
            builder.Property(t => t.WalletId)
                .IsRequired();
            
            builder.Property(t => t.Channel)
                .IsRequired();
            
            builder.Property(t => t.Status)
                .IsRequired();
            
            builder.Property(t => t.ExternalReference)
                .IsRequired(false)
                .HasMaxLength(100);
            
            builder.Property(t => t.FailureReason)
                .IsRequired(false)
                .HasMaxLength(255);
            
            builder.Property(t => t.RequestedAt)
                .IsRequired();
            
            builder.Property(t => t.ConfirmedAt)
                .IsRequired(false);
            
            builder.Property(t => t.FailedAt)
                .IsRequired(false);
            
            builder.Property(t => t.TransactionId)
                .IsRequired(false);
            
            // ValueObject configuration
            builder.OwnsOne(t => t.Amount, amount =>
            {
                amount.Property(m => m.Amount)
                    .HasColumnName("Amount")
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();
                
                amount.Property(m => m.Currency)
                    .HasColumnName("Currency")
                    .HasMaxLength(3)
                    .IsRequired();
            });
            
            // Relationships
            builder.HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.HasOne(t => t.Wallet)
                .WithMany()
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.HasOne(t => t.Transaction)
                .WithMany()
                .HasForeignKey(t => t.TransactionId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired(false);
        }
    }
}