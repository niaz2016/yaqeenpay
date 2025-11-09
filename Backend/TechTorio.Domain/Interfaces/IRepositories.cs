using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Enums;

namespace TechTorio.Domain.Interfaces
{
    public interface IEscrowRepository : IRepository<Escrow>
    {
        Task<IReadOnlyList<Escrow>> GetByBuyerIdAsync(Guid buyerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Escrow>> GetBySellerIdAsync(Guid sellerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Escrow>> GetByStatusAsync(EscrowStatus status, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Escrow>> GetDeliveredEscrowsOlderThanAsync(TimeSpan threshold, CancellationToken cancellationToken = default);
    }

    public interface IOrderRepository : IRepository<Order>
    {
        Task<Order?> GetByEscrowIdAsync(Guid escrowId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Order>> GetByBuyerIdAsync(Guid buyerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Order>> GetBySellerIdAsync(Guid sellerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Order>> GetByStatusAsync(OrderStatus status, CancellationToken cancellationToken = default);
    }

    public interface ILedgerAccountRepository : IRepository<LedgerAccount>
    {
        Task<LedgerAccount?> GetByUserIdAndTypeAsync(Guid userId, LedgerAccountType type, CancellationToken cancellationToken = default);
        Task<LedgerAccount?> GetPlatformAccountByTypeAsync(LedgerAccountType type, string currency = "PKR", CancellationToken cancellationToken = default);
    }

    public interface ILedgerEntryRepository : IRepository<LedgerEntry>
    {
        Task<IReadOnlyList<LedgerEntry>> GetByAccountIdAsync(Guid accountId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<LedgerEntry>> GetByReferenceAsync(ReferenceType referenceType, Guid referenceId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<LedgerEntry>> GetByCorrelationIdAsync(Guid correlationId, CancellationToken cancellationToken = default);
        Task<decimal> GetAccountBalanceAsync(Guid accountId, CancellationToken cancellationToken = default);
    }

    public interface IWithdrawalRepository : IRepository<Withdrawal>
    {
        Task<IReadOnlyList<Withdrawal>> GetBySellerIdAsync(Guid sellerId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Withdrawal>> GetByStatusAsync(WithdrawalStatus status, CancellationToken cancellationToken = default);
    }
}