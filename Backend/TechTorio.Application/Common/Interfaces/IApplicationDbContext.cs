using Microsoft.EntityFrameworkCore;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Common.Interfaces;

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
    DbSet<TechTorio.Domain.Entities.TopUpProof> TopUpProofs { get; }
    DbSet<TechTorio.Domain.Entities.BankSmsPayment> BankSmsPayments { get; }

    DbSet<Dispute> Disputes { get; }
    DbSet<TechTorio.Domain.Entities.AuditLog> AuditLogs { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<NotificationPreference> NotificationPreferences { get; }
    DbSet<UserSettings> UserSettings { get; }
    DbSet<SettingsAudit> SettingsAudits { get; }
    DbSet<UserDevice> UserDevices { get; }
    DbSet<SmsRateLimit> SmsRateLimits { get; }
    DbSet<ApiRateLimit> ApiRateLimits { get; }
    
    // Product Management
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<WishlistItem> WishlistItems { get; }
    DbSet<OrderItem> OrderItems { get; }
    // Product Reviews
    DbSet<TechTorio.Domain.Entities.ProductReview> ProductReviews { get; }

    // Analytics
    DbSet<PageView> PageViews { get; }

    // Subdomain Management
    DbSet<Subdomain> Subdomains { get; }

    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}