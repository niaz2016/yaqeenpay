using MediatR;
using Microsoft.AspNetCore.Identity;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.Entities.Identity;
using TechTorio.Domain.Enums;
using TechTorio.Domain.ValueObjects;

namespace TechTorio.Application.Features.Withdrawals.Commands.RequestWithdrawal
{
    public class RequestWithdrawalCommandHandler : IRequestHandler<RequestWithdrawalCommand, WithdrawalDto>
    {
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IWalletService _walletService;
    private readonly IOutboxService _outboxService;
    private readonly UserManager<ApplicationUser> _userManager;

        public RequestWithdrawalCommandHandler(
            IApplicationDbContext context,
            ICurrentUserService currentUserService,
            IWalletService walletService,
            IOutboxService outboxService,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _currentUserService = currentUserService;
            _walletService = walletService;
            _outboxService = outboxService;
            _userManager = userManager;
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
 
            // Use wallet service to properly debit the wallet and ensure persistence
            await _walletService.DebitWalletAsync(
                wallet.Id, 
                amount, 
                $"Withdrawal request {withdrawal.Reference}",
                withdrawal.Id, 
                "Withdrawal");

            await _context.SaveChangesAsync(cancellationToken);

            // Enqueue notifications after successful save - don't let notification failures affect the withdrawal
            try
            {
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

                // Notify all admin users about the pending withdrawal request
                var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    await _outboxService.EnqueueAsync(
                        "WithdrawalPendingApproval",
                        new {
                            UserId = admin.Id,
                            WithdrawalId = withdrawal.Id,
                            RequesterName = $"{(await _context.Users.FindAsync(userId))?.FirstName} {(await _context.Users.FindAsync(userId))?.LastName}".Trim(),
                            Amount = withdrawal.Amount.Amount,
                            Currency = withdrawal.Amount.Currency,
                            Channel = withdrawal.Channel.ToString(),
                            RequestedAt = withdrawal.RequestedAt,
                            Notes = withdrawal.Notes
                        },
                        cancellationToken);
                }
            }
            catch (Exception ex)
            {
                // Log notification error but don't fail the withdrawal
                // The withdrawal has already been saved successfully
                Console.WriteLine($"Warning: Failed to enqueue withdrawal notifications: {ex.Message}");
            }

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