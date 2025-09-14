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
    public DbSet<TopUp> TopUps => Set<TopUp>();
    public DbSet<KycDocument> KycDocuments => Set<KycDocument>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();


    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<YaqeenPay.Domain.Entities.AuditLog> AuditLogs => Set<YaqeenPay.Domain.Entities.AuditLog>();

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
        
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}