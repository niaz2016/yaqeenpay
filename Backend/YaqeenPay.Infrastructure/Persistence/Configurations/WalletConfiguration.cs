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

            // Configure UpdatedAt for change tracking assistance
            builder.Property(w => w.UpdatedAt)
            .IsRequired();

            // Configure Balance value object with proper change tracking
            builder.OwnsOne(w => w.Balance, balance =>
                 {
                     balance.Property(m => m.Amount)
                   .HasColumnName("Balance_Amount")
          .HasColumnType("decimal(18,2)")
             .IsRequired()
             .HasDefaultValue(0m);

                     balance.Property(m => m.Currency)
              .HasColumnName("Balance_Currency")
              .HasMaxLength(3)
      .IsRequired()
              .HasDefaultValue("PKR");
                 });

            // Ensure EF Core tracks changes to Balance
            builder.Navigation(w => w.Balance)
                .IsRequired();

            // Configure FrozenBalance value object with proper change tracking
            builder.OwnsOne(w => w.FrozenBalance, frozenBalance =>
            {
                frozenBalance.Property(m => m.Amount)
                      .HasColumnName("FrozenBalance")
               .HasColumnType("decimal(18,2)")
                   .IsRequired()
                   .HasDefaultValue(0m);

                frozenBalance.Property(m => m.Currency)
                     .HasColumnName("FrozenBalanceCurrency")
               .HasMaxLength(3)
                   .IsRequired()
   .HasDefaultValue("PKR");
            });

            // Ensure EF Core tracks changes to FrozenBalance
            builder.Navigation(w => w.FrozenBalance)
 .IsRequired();

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