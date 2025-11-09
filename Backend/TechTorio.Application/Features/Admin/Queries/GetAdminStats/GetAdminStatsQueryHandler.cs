using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Queries.GetAdminStats;

public class GetAdminStatsQueryHandler : IRequestHandler<GetAdminStatsQuery, AdminStatsResponse>
{
    private readonly IApplicationDbContext _context;

    public GetAdminStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsResponse> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var oneMonthAgo = now.AddMonths(-1);

        // Calculate statistics
        var totalUsers = await _context.Users.CountAsync(cancellationToken);
        
        var activeUsers = await _context.Users
            .Where(u => u.EmailConfirmed)
            .CountAsync(cancellationToken);

        var pendingKycDocuments = await _context.KycDocuments
            .Where(k => k.Status == KycDocumentStatus.Pending)
            .CountAsync(cancellationToken);

        var pendingSellers = await _context.BusinessProfiles
            .Where(b => b.VerificationStatus == SellerVerificationStatus.Pending)
            .CountAsync(cancellationToken);

        var activeOrders = await _context.Orders
            .Where(o => o.Status == OrderStatus.Created || 
                       o.Status == OrderStatus.PaymentConfirmed || 
                       o.Status == OrderStatus.Shipped ||
                       o.Status == OrderStatus.DeliveredPendingDecision)
            .CountAsync(cancellationToken);

        var openDisputes = await _context.Disputes
            .Where(d => d.Status == DisputeStatus.Open || d.Status == DisputeStatus.Escalated)
            .CountAsync(cancellationToken);


        // Calculate total transaction volume from wallet transactions  
        var transactions = await _context.WalletTransactions
            .Where(t => t.Type == TransactionType.Payment || t.Type == TransactionType.Credit)
            .ToListAsync(cancellationToken);
        var totalTransactionVolume = transactions.Sum(t => t.Amount.Amount);

        // Calculate total wallet balance across all users
        var wallets = await _context.Wallets
            .ToListAsync(cancellationToken);
        var totalWalletBalance = wallets.Sum(w => w.Balance.Amount);

        // Calculate monthly growth rate based on user registrations
        var usersThisMonth = await _context.Users
            .Where(u => u.Created >= oneMonthAgo)
            .CountAsync(cancellationToken);

        var usersLastMonth = await _context.Users
            .Where(u => u.Created >= oneMonthAgo.AddMonths(-1) && u.Created < oneMonthAgo)
            .CountAsync(cancellationToken);

        var monthlyGrowthRate = usersLastMonth > 0 
            ? ((double)(usersThisMonth - usersLastMonth) / usersLastMonth) * 100
            : 0;

        return new AdminStatsResponse
        {
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            PendingKycDocuments = pendingKycDocuments,
            PendingSellers = pendingSellers,
            ActiveOrders = activeOrders,
            OpenDisputes = openDisputes,
            TotalTransactionVolume = totalTransactionVolume,
            MonthlyGrowthRate = monthlyGrowthRate,
            TotalWalletBalance = totalWalletBalance
        };
    }
}