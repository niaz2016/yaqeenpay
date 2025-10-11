using Microsoft.EntityFrameworkCore;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<OutboxMessage> OutboxMessages { get; }
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
    DbSet<WalletTopupLock> WalletTopupLocks { get; }
    DbSet<TopUp> TopUps { get; }
    DbSet<YaqeenPay.Domain.Entities.TopUpProof> TopUpProofs { get; }
    DbSet<YaqeenPay.Domain.Entities.BankSmsPayment> BankSmsPayments { get; }

    DbSet<Dispute> Disputes { get; }
    DbSet<YaqeenPay.Domain.Entities.AuditLog> AuditLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<NotificationPreference> NotificationPreferences { get; }
    DbSet<UserSettings> UserSettings { get; }
    DbSet<SettingsAudit> SettingsAudits { get; }
    
    // Product Management
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<OrderItem> OrderItems { get; }

    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}