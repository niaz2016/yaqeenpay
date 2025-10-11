using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Features.Wallets.DTOs;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Wallets.Services
{
    public interface IWalletTopupService
    {
        Task<WalletTopupResponse> CreateTopupRequestAsync(Guid userId, WalletTopupRequest request, string? baseUrl = null);
        Task<bool> VerifyAndCompleteTopupAsync(string transactionReference, decimal paidAmount);
        Task CleanupExpiredLocksAsync();
        Task<decimal> GetUserWalletBalanceAsync(Guid userId);
        Task<WalletTopupResponse?> MarkPaymentInitiatedAsync(Guid userId, string transactionReference);
    }

    public class WalletTopupService : IWalletTopupService
    {
    private readonly IApplicationDbContext _context;
    private readonly IQrCodeService _qrCodeService;
    private readonly ILogger<WalletTopupService> _logger;
    private readonly IConfiguration _config;
        
    private const int LOCK_EXPIRY_MINUTES = 2; // hard cap at 2 minutes

        public WalletTopupService(
            IApplicationDbContext context,
            IQrCodeService qrCodeService,
            ILogger<WalletTopupService> logger,
            IConfiguration config)
        {
            _context = context;
            _qrCodeService = qrCodeService;
            _logger = logger;
            _config = config;
        }

        public async Task<WalletTopupResponse> CreateTopupRequestAsync(Guid userId, WalletTopupRequest request, string? baseUrl = null)
        {
            try
            {
                // Clean up expired locks first
                await CleanupExpiredLocksAsync();

                var originalAmount = new Money(request.Amount, request.Currency);
                var finalAmount = originalAmount;

                // Check if amount is already locked by another user
                var existingLock = await _context.WalletTopupLocks
                    .FirstOrDefaultAsync(x => x.Amount.Amount == originalAmount.Amount && 
                                            x.Status == TopupLockStatus.Locked && 
                                            x.ExpiresAt > DateTime.UtcNow &&
                                            x.UserId != userId);

                if (existingLock != null)
                {
                    // Auto-assign a unique +1 PKR amount until free, then proceed (do not fail)
                    finalAmount = new Money(originalAmount.Amount + 1, originalAmount.Currency);
                    while (true)
                    {
                        var suggestedLock = await _context.WalletTopupLocks
                            .FirstOrDefaultAsync(x => x.Amount.Amount == finalAmount.Amount && 
                                                    x.Status == TopupLockStatus.Locked && 
                                                    x.ExpiresAt > DateTime.UtcNow);
                        if (suggestedLock == null) break;
                        finalAmount = new Money(finalAmount.Amount + 1, finalAmount.Currency);
                    }
                }

                // Create lock for the amount with configurable expiry
                var expiryStr = _config["QrTopup:LockExpiryMinutes"];
                int expiryMinutes = LOCK_EXPIRY_MINUTES;
                if (!string.IsNullOrWhiteSpace(expiryStr) && int.TryParse(expiryStr, out var cfgMin) && cfgMin > 0)
                {
                    // Cap to 2 minutes maximum as per requirement
                    expiryMinutes = Math.Min(cfgMin, LOCK_EXPIRY_MINUTES);
                }
                var topupLock = WalletTopupLock.Create(userId, finalAmount, expiryMinutes);

                _context.WalletTopupLocks.Add(topupLock);
                await _context.SaveChangesAsync(CancellationToken.None);

                // Generate QR string/payload via service (service currently returns complete string)
                var qrString = await _qrCodeService.GenerateQrImageAsync(topupLock.TransactionReference!, finalAmount.Amount, baseUrl);
                var qrImageUrl = qrString; // backward-compat: some clients expect this field
                var qrPayload = qrString;   // explicit payload for scanners

                return new WalletTopupResponse
                {
                    Success = true,
                    Message = originalAmount.Amount == finalAmount.Amount 
                        ? "Topup request created successfully. Please scan the QR code to complete payment."
                        : $"Amount PKR {originalAmount.Amount} was busy. Assigned unique amount PKR {finalAmount.Amount}.",
                    SuggestedAmount = finalAmount.Amount, // kept for backward compatibility
                    EffectiveAmount = finalAmount.Amount,
                    QrImageUrl = qrImageUrl,
                    QrPayload = qrPayload,
                    TransactionReference = topupLock.TransactionReference,
                    CurrentBalance = await GetUserWalletBalanceAsync(userId),
                    ExpiresAt = topupLock.ExpiresAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating topup request for user {UserId}", userId);
                return new WalletTopupResponse
                {
                    Success = false,
                    Message = "An error occurred while creating the topup request. Please try again."
                };
            }
        }

        public async Task<bool> VerifyAndCompleteTopupAsync(string transactionReference, decimal paidAmount)
        {
            try
            {
                var topupLock = await _context.WalletTopupLocks
                    .Include(x => x.User)
                    .FirstOrDefaultAsync(x => x.TransactionReference == transactionReference && x.Status == TopupLockStatus.Locked);

                if (topupLock == null)
                {
                    return false;
                }

                if (topupLock.IsExpired())
                {
                    topupLock.MarkAsExpired();
                    await _context.SaveChangesAsync(CancellationToken.None);
                    return false;
                }

                if (paidAmount != topupLock.Amount.Amount)
                {
                    return false;
                }

                // Update user wallet balance
                var wallet = await _context.Wallets.FirstOrDefaultAsync(x => x.UserId == topupLock.UserId);
                if (wallet == null)
                {
                    // Create wallet if doesn't exist
                    wallet = Wallet.Create(topupLock.UserId, topupLock.Amount.Currency);
                    _context.Wallets.Add(wallet);
                }

                // Credit the wallet
                wallet.Credit(topupLock.Amount, $"Wallet topup via QR payment - {transactionReference}");

                // Mark lock as completed
                topupLock.MarkAsCompleted();
                // Expire QR immediately once paid (so it's not reusable)
                typeof(WalletTopupLock)
                    .GetProperty("ExpiresAt")!
                    .SetValue(topupLock, DateTime.UtcNow);

                await _context.SaveChangesAsync(CancellationToken.None);

                _logger.LogInformation("Wallet topup completed for user {UserId}, amount {Amount}, reference {TransactionReference}", 
                    topupLock.UserId, paidAmount, transactionReference);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error completing topup for transaction reference {TransactionReference}", transactionReference);
                return false;
            }
        }

        public async Task CleanupExpiredLocksAsync()
        {
            try
            {
                var expiredLocks = await _context.WalletTopupLocks
                    .Where(x => x.Status == TopupLockStatus.Locked && x.ExpiresAt < DateTime.UtcNow)
                    .ToListAsync();

                foreach (var lockItem in expiredLocks)
                {
                    lockItem.MarkAsExpired();
                }

                if (expiredLocks.Any())
                {
                    await _context.SaveChangesAsync(CancellationToken.None);
                    _logger.LogInformation("Cleaned up {Count} expired topup locks", expiredLocks.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired locks");
            }
        }

        public async Task<decimal> GetUserWalletBalanceAsync(Guid userId)
        {
            var wallet = await _context.Wallets.FirstOrDefaultAsync(x => x.UserId == userId);
            return wallet?.Balance.Amount ?? 0;
        }

        public async Task<WalletTopupResponse?> MarkPaymentInitiatedAsync(Guid userId, string transactionReference)
        {
            try
            {
                var topupLock = await _context.WalletTopupLocks.FirstOrDefaultAsync(x => x.TransactionReference == transactionReference && x.UserId == userId);
                if (topupLock == null) return null;
                if (topupLock.IsExpired())
                {
                    topupLock.MarkAsExpired();
                    await _context.SaveChangesAsync(CancellationToken.None);
                    return new WalletTopupResponse { Success = false, Message = "Lock expired" };
                }
                // Extend / mark awaiting confirmation
                topupLock.MarkAwaitingConfirmation(2);
                await _context.SaveChangesAsync(CancellationToken.None);
                return new WalletTopupResponse
                {
                    Success = true,
                    Message = "Payment marked as initiated. Awaiting confirmation.",
                    EffectiveAmount = topupLock.Amount.Amount,
                    SuggestedAmount = topupLock.Amount.Amount,
                    TransactionReference = topupLock.TransactionReference,
                    CurrentBalance = await GetUserWalletBalanceAsync(userId),
                    ExpiresAt = topupLock.ExpiresAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking payment initiated for {TransactionReference}", transactionReference);
                return new WalletTopupResponse { Success = false, Message = "Failed to mark payment initiated" };
            }
        }
    }
}