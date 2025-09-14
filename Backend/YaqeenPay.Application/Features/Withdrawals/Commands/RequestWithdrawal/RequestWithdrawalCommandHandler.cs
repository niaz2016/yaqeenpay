using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Withdrawals.Commands.RequestWithdrawal
{
    public class RequestWithdrawalCommandHandler : IRequestHandler<RequestWithdrawalCommand, WithdrawalDto>
    {
        private readonly IApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly IWalletService _walletService;

        public RequestWithdrawalCommandHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService,
            IWalletService walletService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _walletService = walletService;
        }

        public async Task<WithdrawalDto> Handle(RequestWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");

            // Get user's wallet (unified - no wallet type)
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            
            // If wallet doesn't exist, create it
            if (wallet == null)
            {
                wallet = await _walletService.CreateWalletAsync(userId, request.Currency);
            }

            // Check if sufficient balance is available
            if (wallet.Balance.Amount < request.Amount)
            {
                throw new InvalidOperationException("Insufficient balance for withdrawal");
            }

            // Create withdrawal entity
            var withdrawalChannel = MapPaymentMethodToChannel(request.PaymentMethod);
            var amount = new Money(request.Amount, request.Currency);
            var withdrawal = new Withdrawal(userId, amount, withdrawalChannel);

            // Add to database
            _context.Withdrawals.Add(withdrawal);

            // Create a withdrawal transaction to reduce wallet balance
            wallet.Debit(amount, $"Withdrawal request #{withdrawal.Id}");

            await _context.SaveChangesAsync(cancellationToken);

            // Map to DTO
            return new WithdrawalDto
            {
                Id = withdrawal.Id,
                SellerId = withdrawal.SellerId,
                Amount = withdrawal.Amount.Amount,
                Currency = withdrawal.Amount.Currency,
                Channel = withdrawal.Channel,
                ChannelReference = withdrawal.ChannelReference,
                Status = withdrawal.Status,
                RequestedAt = withdrawal.RequestedAt,
                SettledAt = withdrawal.SettledAt,
                FailedAt = withdrawal.FailedAt,
                FailureReason = withdrawal.FailureReason,
                CreatedAt = withdrawal.CreatedAt,
                UpdatedAt = withdrawal.LastModifiedAt ?? withdrawal.CreatedAt
            };
        }

        private static WithdrawalChannel MapPaymentMethodToChannel(string paymentMethod)
        {
            return paymentMethod.ToLowerInvariant() switch
            {
                "bank_transfer" => WithdrawalChannel.BankTransfer,
                "jazzcash" => WithdrawalChannel.JazzCash,
                "easypaisa" => WithdrawalChannel.Easypaisa,
                _ => WithdrawalChannel.BankTransfer
            };
        }
    }
}