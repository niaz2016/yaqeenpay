using Microsoft.EntityFrameworkCore;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Escrow> Escrows { get; }
    DbSet<Order> Orders { get; }
    DbSet<LedgerAccount> LedgerAccounts { get; }
    DbSet<LedgerEntry> LedgerEntries { get; }
    DbSet<Withdrawal> Withdrawals { get; }
    DbSet<ApplicationUser> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<KycDocument> KycDocuments { get; }
    DbSet<BusinessProfile> BusinessProfiles { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<WalletTransaction> WalletTransactions { get; }
    DbSet<TopUp> TopUps { get; }
    DbSet<Dispute> Disputes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}