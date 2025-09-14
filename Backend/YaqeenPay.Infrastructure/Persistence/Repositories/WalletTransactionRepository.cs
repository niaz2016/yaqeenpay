using Microsoft.EntityFrameworkCore;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Infrastructure.Persistence;

namespace YaqeenPay.Infrastructure.Persistence.Repositories
{
    public class WalletTransactionRepository : IWalletTransactionRepository
    {
        private readonly ApplicationDbContext _context;

        public WalletTransactionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<WalletTransaction?> GetByIdAsync(Guid id)
        {
            return await _context.WalletTransactions
                .FindAsync(id);
        }

        public async Task<IEnumerable<WalletTransaction>> GetByWalletIdAsync(Guid walletId, int page = 1, int pageSize = 20)
        {
            return await _context.WalletTransactions
                .Where(t => t.WalletId == walletId)
                .OrderByDescending(t => t.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<WalletTransaction> CreateAsync(WalletTransaction transaction)
        {
            _context.WalletTransactions.Add(transaction);
            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task<int> GetTransactionCountByWalletIdAsync(Guid walletId)
        {
            return await _context.WalletTransactions
                .CountAsync(t => t.WalletId == walletId);
        }
    }
}