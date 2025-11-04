using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Infrastructure.Persistence.Configurations
{
    public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
    {
        public void Configure(EntityTypeBuilder<Wallet> builder)
        {
            builder.HasKey(w => w.Id);
            
            builder.Property(w => w.UserId)
                .IsRequired();
            
            // Add unique index on UserId to prevent duplicate wallets
            builder.HasIndex(w => w.UserId)
                .IsUnique();
            
            builder.Property(w => w.IsActive)
                .IsRequired();
            
            // ValueObject configuration with backing field tracking
            builder.OwnsOne(w => w.Balance, balance =>
            {
                balance.Property(m => m.Amount)
                    .HasColumnName("Balance_Amount")
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();
                
                balance.Property(m => m.Currency)
                    .HasColumnName("Balance_Currency")
                    .HasMaxLength(3)
                    .IsRequired();
            });
            
            builder.Navigation(w => w.Balance)
                .IsRequired()
                .UsePropertyAccessMode(PropertyAccessMode.Field)
                .HasField("_balance");

            builder.OwnsOne(w => w.FrozenBalance, frozenBalance =>
            {
                frozenBalance.Property(m => m.Amount)
                    .HasColumnName("FrozenBalance")
                    .HasColumnType("decimal(18,2)")
                    .IsRequired();
                
                frozenBalance.Property(m => m.Currency)
                    .HasColumnName("FrozenBalanceCurrency")
                    .HasMaxLength(3)
                    .IsRequired();
            });
            
            builder.Navigation(w => w.FrozenBalance)
                .IsRequired()
                .UsePropertyAccessMode(PropertyAccessMode.Field)
                .HasField("_frozenBalance");
            
            // Relationships
            builder.HasOne(w => w.User)
                .WithMany()
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            builder.HasMany(w => w.Transactions)
                .WithOne(t => t.Wallet)
                .HasForeignKey(t => t.WalletId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}