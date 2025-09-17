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
    private readonly IOutboxService _outboxService;

        public RequestWithdrawalCommandHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService,
            IWalletService walletService,
            IOutboxService outboxService)
        {
            _context = context;
            _currentUserService = currentUserService;
            _walletService = walletService;
            _outboxService = outboxService;
        }

        public async Task<WithdrawalDto> Handle(RequestWithdrawalCommand request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

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
            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                // Persist free-form notes (may contain bank details submitted by seller)
                withdrawal.Notes = request.Notes;
            }

            // Add to database
            _context.Withdrawals.Add(withdrawal);

            // Create a withdrawal transaction to reduce wallet balance
            wallet.Debit(amount, $"Withdrawal request {withdrawal.Reference}");

            await _context.SaveChangesAsync(cancellationToken);

            // Enqueue notification (withdrawal initiated)
            await _outboxService.EnqueueAsync(
                "WithdrawalInitiated",
                new {
                    UserId = userId,
                    WithdrawalId = withdrawal.Id,
                    Amount = withdrawal.Amount.Amount,
                    Currency = withdrawal.Amount.Currency,
                    Channel = withdrawal.Channel.ToString(),
                    RequestedAt = withdrawal.RequestedAt
                },
                cancellationToken);

            // Map to DTO
            return new WithdrawalDto
            {
                Id = withdrawal.Id,
                SellerId = withdrawal.SellerId,
                Amount = withdrawal.Amount.Amount,
                Currency = withdrawal.Amount.Currency,
                Channel = withdrawal.Channel,
                ChannelReference = withdrawal.ChannelReference,
                Reference = withdrawal.Reference,
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