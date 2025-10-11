using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.Interfaces;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Infrastructure.Services
{
    public class WalletService(
        IWalletRepository walletRepository,
        IWalletTransactionRepository transactionRepository,
        ITopUpRepository topUpRepository,
        IUnitOfWork unitOfWork,
        ILogger<WalletService> logger,
        YaqeenPay.Application.Common.Interfaces.IApplicationDbContext db,
        YaqeenPay.Application.Common.Interfaces.IOutboxService outboxService) : IWalletService
    {
    private readonly IWalletRepository _walletRepository = walletRepository;
    private readonly IWalletTransactionRepository _transactionRepository = transactionRepository;
    private readonly ITopUpRepository _topUpRepository = topUpRepository;
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly ILogger<WalletService> _logger = logger;
    private readonly IApplicationDbContext _db = db;
    private readonly IOutboxService _outboxService = outboxService;

        public async Task<List<Application.Common.Models.TopUpDto>> GetAllTopUpsAsync(int page = 1, int pageSize = 100)
        {
            var topUps = await _topUpRepository.GetAllAsync(page, pageSize);
            var result = new List<Application.Common.Models.TopUpDto>();

            foreach (var t in topUps)
            {
                var dto = new Application.Common.Models.TopUpDto
                {
                    Id = t.Id,
                    UserId = t.UserId,
                    WalletId = t.WalletId,
                    Amount = t.Amount.Amount,
                    Currency = t.Amount.Currency,
                    Channel = t.Channel,
                    Status = t.Status,
                    ExternalReference = t.ExternalReference,
                    RequestedAt = t.RequestedAt,
                    ConfirmedAt = t.ConfirmedAt,
                    FailedAt = t.FailedAt,
                    FailureReason = t.FailureReason
                };

                // Load proofs for this top-up
                var proofs = await _db.TopUpProofs.Where(p => p.TopUpId == dto.Id).ToListAsync();
                if (proofs != null && proofs.Count > 0)
                {
                    dto.Proofs = proofs.Select(p => new TopUpProofDto { TopUpId = p.TopUpId, FileName = p.FileName, FileUrl = p.FileUrl, Notes = p.Notes, UploadedAt = p.UploadedAt }).ToList();
                    dto.ProofUrl = dto.Proofs.FirstOrDefault()?.FileUrl;
                }

                result.Add(dto);
            }

            return result;
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

            // Idempotency: if already confirmed with same (or any) external reference, no-op
            if (topUp.Status == TopUpStatus.Confirmed)
            {
                _logger.LogInformation("Top-up {TopUpId} already confirmed; skipping", topUpId);
                return topUp;
            }

            // Prevent duplicate confirmation by checking for another top-up with same external reference
            if (!string.IsNullOrWhiteSpace(externalReference))
            {
                var existingRef = await _topUpRepository.GetByExternalReferenceAsync(externalReference);
                if (existingRef != null && existingRef.Id != topUpId && existingRef.Status == TopUpStatus.Confirmed)
                {
                    throw new InvalidOperationException("External reference already used for a different top-up");
                }
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

                // Enqueue a notification about successful top-up. Do not let notification failures break the flow.
                try
                {
                    await _outboxService.EnqueueAsync("TopUpConfirmed", new {
                        UserId = topUp.UserId,
                        TopUpId = topUp.Id,
                        Amount = topUp.Amount.Amount,
                        Currency = topUp.Amount.Currency,
                        ExternalReference = externalReference,
                        ConfirmedAt = topUp.ConfirmedAt
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to enqueue top-up notification for TopUpId={TopUpId}", topUp.Id);
                }

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