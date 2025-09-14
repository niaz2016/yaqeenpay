using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Infrastructure.Services
{
    public class WalletService : IWalletService
    {
        private readonly IWalletRepository _walletRepository;
        private readonly IWalletTransactionRepository _transactionRepository;
        private readonly ITopUpRepository _topUpRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<WalletService> _logger;

        public WalletService(
            IWalletRepository walletRepository,
            IWalletTransactionRepository transactionRepository,
            ITopUpRepository topUpRepository,
            IUnitOfWork unitOfWork,
            ILogger<WalletService> logger)
        {
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
            _topUpRepository = topUpRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Wallet> CreateWalletAsync(Guid userId, string currency = "PKR")
        {
            var existingWallet = await _walletRepository.GetByUserIdAsync(userId);
            if (existingWallet != null)
            {
                return existingWallet;
            }

            var wallet = Wallet.Create(userId, currency);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                wallet = await _walletRepository.CreateAsync(wallet);
                await _unitOfWork.CommitTransactionAsync();
                return wallet;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error creating wallet for user {UserId}", userId);
                throw;
            }
        }

        public async Task<Wallet?> GetWalletAsync(Guid walletId)
        {
            return await _walletRepository.GetByIdAsync(walletId);
        }

        public async Task<Wallet?> GetWalletByUserIdAsync(Guid userId)
        {
            return await _walletRepository.GetByUserIdAsync(userId);
        }

        public async Task<Money?> GetBalanceAsync(Guid walletId)
        {
            return await _walletRepository.GetBalanceAsync(walletId);
        }

        public async Task<bool> HasSufficientFundsAsync(Guid walletId, Money amount)
        {
            return await _walletRepository.HasSufficientFundsAsync(walletId, amount);
        }

        public async Task<Guid> TopUpInitiateAsync(Guid userId, Money amount, TopUpChannel channel)
        {
            var wallet = await _walletRepository.GetByUserIdAsync(userId);
            if (wallet == null)
            {
                // Create wallet if it doesn't exist
                wallet = await CreateWalletAsync(userId, amount.Currency);
            }

            var topUp = new TopUp(userId, wallet.Id, amount, channel);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                await _topUpRepository.CreateAsync(topUp);
                await _unitOfWork.CommitTransactionAsync();
                return topUp.Id;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error initiating top-up for user {UserId}", userId);
                throw;
            }
        }

        public async Task<TopUp?> GetTopUpAsync(Guid topUpId)
        {
            return await _topUpRepository.GetByIdAsync(topUpId);
        }

        public async Task<IEnumerable<TopUp>> GetTopUpsByUserIdAsync(Guid userId, int page = 1, int pageSize = 20)
        {
            return await _topUpRepository.GetByUserIdAsync(userId, page, pageSize);
        }

        public async Task<TopUp> TopUpConfirmAsync(Guid topUpId, string externalReference)
        {
            var topUp = await _topUpRepository.GetByIdAsync(topUpId);
            if (topUp == null)
            {
                throw new InvalidOperationException($"Top-up not found with ID {topUpId}");
            }

            var wallet = await _walletRepository.GetByIdAsync(topUp.WalletId);
            if (wallet == null)
            {
                throw new InvalidOperationException($"Wallet not found with ID {topUp.WalletId}");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Confirm the top-up
                topUp.Confirm(externalReference);

                // Credit the wallet
                wallet.Credit(topUp.Amount, $"Top-up confirmed: {externalReference}");
                
                // Update the wallet
                await _walletRepository.UpdateAsync(wallet);
                
                // Get the latest transaction
                var transaction = wallet.Transactions.Last();
                
                // Link the transaction to the top-up
                topUp.SetTransactionId(transaction.Id);
                
                // Update the top-up
                await _topUpRepository.UpdateAsync(topUp);
                
                await _unitOfWork.CommitTransactionAsync();
                
                return topUp;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error confirming top-up {TopUpId}", topUpId);
                throw;
            }
        }

        public async Task<TopUp> TopUpFailAsync(Guid topUpId, string reason)
        {
            var topUp = await _topUpRepository.GetByIdAsync(topUpId);
            if (topUp == null)
            {
                throw new InvalidOperationException($"Top-up not found with ID {topUpId}");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                topUp.Fail(reason);
                await _topUpRepository.UpdateAsync(topUp);
                await _unitOfWork.CommitTransactionAsync();
                return topUp;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error failing top-up {TopUpId}", topUpId);
                throw;
            }
        }

        public async Task<WalletTransaction> CreditWalletAsync(Guid walletId, Money amount, string reason, Guid? referenceId = null, string? referenceType = null)
        {
            var wallet = await _walletRepository.GetByIdAsync(walletId);
            if (wallet == null)
            {
                throw new InvalidOperationException($"Wallet not found with ID {walletId}");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                wallet.Credit(amount, reason);
                
                // Get the transaction
                var transaction = wallet.Transactions.Last();
                
                // Set reference information if provided
                if (referenceId.HasValue && !string.IsNullOrEmpty(referenceType))
                {
                    transaction.SetReferenceInformation(referenceId.Value, referenceType);
                }
                
                // Update the wallet
                await _walletRepository.UpdateAsync(wallet);
                
                await _unitOfWork.CommitTransactionAsync();
                
                return transaction;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error crediting wallet {WalletId}", walletId);
                throw;
            }
        }

        public async Task<WalletTransaction> DebitWalletAsync(Guid walletId, Money amount, string reason, Guid? referenceId = null, string? referenceType = null)
        {
            var wallet = await _walletRepository.GetByIdAsync(walletId);
            if (wallet == null)
            {
                throw new InvalidOperationException($"Wallet not found with ID {walletId}");
            }

            if (!await HasSufficientFundsAsync(walletId, amount))
            {
                throw new InvalidOperationException($"Insufficient funds in wallet {walletId}");
            }

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                wallet.Debit(amount, reason);
                
                // Get the transaction
                var transaction = wallet.Transactions.Last();
                
                // Set reference information if provided
                if (referenceId.HasValue && !string.IsNullOrEmpty(referenceType))
                {
                    transaction.SetReferenceInformation(referenceId.Value, referenceType);
                }
                
                // Update the wallet
                await _walletRepository.UpdateAsync(wallet);
                
                await _unitOfWork.CommitTransactionAsync();
                
                return transaction;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                _logger.LogError(ex, "Error debiting wallet {WalletId}", walletId);
                throw;
            }
        }

        public async Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId, int page = 1, int pageSize = 20)
        {
            return await _transactionRepository.GetByWalletIdAsync(walletId, page, pageSize);
        }

        public async Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId, DateTime startDate, DateTime endDate)
        {
            // Get all transactions for the wallet within the date range
            var allTransactions = await _transactionRepository.GetByWalletIdAsync(walletId, 1, int.MaxValue);
            return allTransactions.Where(t => t.CreatedAt >= startDate && t.CreatedAt <= endDate);
        }

        public async Task<IEnumerable<WalletTransaction>> GetTransactionHistoryAsync(Guid walletId)
        {
            // Get all transactions for the wallet
            return await _transactionRepository.GetByWalletIdAsync(walletId, 1, int.MaxValue);
        }
    }
}