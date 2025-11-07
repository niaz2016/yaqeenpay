using Microsoft.EntityFrameworkCore;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Domain.ValueObjects;
using YaqeenPay.Infrastructure.Persistence;

namespace YaqeenPay.Infrastructure.Persistence.Repositories
{
    public class WalletRepository : IWalletRepository
    {
        private readonly ApplicationDbContext _context;

        public WalletRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Wallet?> GetByIdAsync(Guid id)
        {
            return await _context.Wallets
                .FindAsync(id);
        }

        public async Task<Wallet?> GetByUserIdAsync(Guid userId)
        {
            return await _context.Wallets
                .FirstOrDefaultAsync(w => w.UserId == userId);
        }

        public async Task<Wallet> CreateAsync(Wallet wallet)
        {
            _context.Wallets.Add(wallet);
            await _context.SaveChangesAsync();
            return wallet;
        }

        public async Task UpdateAsync(Wallet wallet)
        {
            // Ensure EF Core is tracking the entity and marks Money value objects as modified
            _context.Wallets.Update(wallet);
            await _context.SaveChangesAsync();
        }

        public async Task<Money?> GetBalanceAsync(Guid walletId)
        {
            var wallet = await _context.Wallets.FindAsync(walletId);
            return wallet?.Balance;
        }

        public async Task<bool> HasSufficientFundsAsync(Guid walletId, Money amount)
        {
            var wallet = await _context.Wallets.FindAsync(walletId);
            return wallet != null && wallet.HasSufficientFunds(amount);
        }
    }
}