using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations
{
    public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
    {
        public void Configure(EntityTypeBuilder<WalletTransaction> builder)
        {
            builder.HasKey(t => t.Id);
            
            builder.Property(t => t.WalletId)
                .IsRequired();
            
            builder.Property(t => t.Type)
                .IsRequired();
            
            builder.Property(t => t.Reason)
                .IsRequired()
                .HasMaxLength(255);
            
            builder.Property(t => t.ReferenceId)
                .IsRequired(false);
            
            builder.Property(t => t.ReferenceType)
                .IsRequired(false)
                .HasMaxLength(50);
            
            builder.Property(t => t.ExternalReference)
                .IsRequired(false)
                .HasMaxLength(100);
            
            // ValueObject configuration
            builder.OwnsOne(t => t.Amount, amount =>
            {
                amount.Property(m => m.Amount)
                    .HasColumnName("Amount")
                    .HasColumnType("decimal(18,2)")
                    .IsRequired()
                    .HasDefaultValue(0m); // Ensure we have a default value
                
                amount.Property(m => m.Currency)
                    .HasColumnName("Currency")
                    .HasMaxLength(3)
                    .IsRequired()
                    .HasDefaultValue("PKR"); // Ensure we have a default currency
            });
            
            // Relationships
            builder.HasOne(t => t.Wallet)
                .WithMany(w => w.Transactions)
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}