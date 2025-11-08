using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Common;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService) : base(options)
    {
        _currentUserService = currentUserService;
    }
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();
    public DbSet<Escrow> Escrows => Set<Escrow>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<LedgerAccount> LedgerAccounts => Set<LedgerAccount>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<Withdrawal> Withdrawals => Set<Withdrawal>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<WalletTopupLock> WalletTopupLocks => Set<WalletTopupLock>();
    public DbSet<TopUp> TopUps => Set<TopUp>();
    public DbSet<TopUpProof> TopUpProofs => Set<TopUpProof>();
    public DbSet<BankSmsPayment> BankSmsPayments => Set<BankSmsPayment>();
    public DbSet<KycDocument> KycDocuments => Set<KycDocument>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<SettingsAudit> SettingsAudits => Set<SettingsAudit>();
    public DbSet<AdminSystemSettings> AdminSystemSettings => Set<AdminSystemSettings>();
    public DbSet<AdminSettingsAudit> AdminSettingsAudits => Set<AdminSettingsAudit>();
    public DbSet<UserDevice> UserDevices => Set<UserDevice>();
    public DbSet<SmsRateLimit> SmsRateLimits => Set<SmsRateLimit>();
    public DbSet<ApiRateLimit> ApiRateLimits => Set<ApiRateLimit>();
    
    // Product Management
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    // Analytics
    public DbSet<PageView> PageViews => Set<PageView>();

    // Rating System
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<RatingStats> RatingStats => Set<RatingStats>();
    // Product Reviews
    public DbSet<YaqeenPay.Domain.Entities.ProductReview> ProductReviews => Set<YaqeenPay.Domain.Entities.ProductReview>();

    // Subdomain Management
    public DbSet<Subdomain> Subdomains => Set<Subdomain>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.LastModifiedBy = _currentUserService.UserId;
                    entry.Entity.LastModifiedAt = DateTime.UtcNow;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Ignore abstract base types to prevent EF Core from treating them as entities
        builder.Ignore<AuditableEntity>();
        // NOTE: TopUpProof entity will be discovered by convention. If explicit configuration is required,
        // add an IEntityTypeConfiguration<TopUpProof> implementation under the Infrastructure project.
        
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
