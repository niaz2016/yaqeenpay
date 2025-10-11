using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.ConfirmDelivery;

public record ConfirmDeliveryCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

public class ConfirmDeliveryCommandHandler : IRequestHandler<ConfirmDeliveryCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly Interfaces.IOrderNotificationService _orderNotificationService;

    public ConfirmDeliveryCommandHandler(
        IApplicationDbContext context,
        Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<bool> Handle(ConfirmDeliveryCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Seller)
            .Include(o => o.Buyer)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {request.OrderId} not found.");
        }

        // Verify that the user is the buyer
        if (order.BuyerId != request.UserId)
        {
            throw new UnauthorizedAccessException("Only the buyer can confirm delivery.");
        }

        // Verify that the order is in the correct status for delivery confirmation
        if (order.Status != OrderStatus.Shipped)
        {
            throw new InvalidOperationException($"Cannot confirm delivery for order in status {order.Status}. Order must be shipped first.");
        }

        if (!order.IsAmountFrozen || order.FrozenAmount == null)
        {
            throw new InvalidOperationException("No frozen amount found for this order.");
        }

        try
        {
            // First, mark the order as delivered (since we have no shipper integration)
            // This changes status from Shipped -> DeliveredPendingDecision
            order.MarkAsDelivered();

            // Get the seller's wallet with transactions
            var sellerWallet = await _context.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.UserId == order.SellerId, cancellationToken);

            if (sellerWallet == null)
            {
                throw new InvalidOperationException($"Seller wallet not found for user ID: {order.SellerId}");
            }

            // Get buyer's wallet with transactions to unfreeze/debit the amount
            var buyerWallet = await _context.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.UserId == order.BuyerId, cancellationToken);

            if (buyerWallet == null)
            {
                throw new InvalidOperationException($"Buyer wallet not found for user ID: {order.BuyerId}");
            }

            // Verify the frozen amount and wallet balances before proceeding
            var transferAmount = order.FrozenAmount;
            
            if (transferAmount == null)
            {
                throw new InvalidOperationException($"Order {order.Id} has no frozen amount set. Cannot complete delivery.");
            }
            
            if (buyerWallet.FrozenBalance.Amount < transferAmount.Amount)
            {
                throw new InvalidOperationException($"Insufficient frozen funds in buyer wallet. Required: {transferAmount.Amount}, Available: {buyerWallet.FrozenBalance.Amount}");
            }

            // Transfer frozen amount to debit first (removes both frozen and total balance from buyer)
            buyerWallet.TransferFrozenToDebit(transferAmount, $"Payment completed for order {order.Id}");

            // Transfer the amount to the seller's wallet
            sellerWallet.Credit(transferAmount, $"Payment received for order {order.Id}");

            // Now complete the order (DeliveredPendingDecision -> Completed)
            order.CompleteOrder();

            await _context.SaveChangesAsync(cancellationToken);

            // Send completion notifications to both buyer and seller
            try
            {
                await _orderNotificationService.NotifyCompleted(order);
            }
            catch (Exception ex)
            {
                // Log notification error but don't fail the delivery confirmation
                System.Console.WriteLine($"Failed to send completion notifications: {ex.Message}");
            }

            return true;
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException($"Cannot confirm delivery: {ex.Message}");
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            throw new InvalidOperationException($"Database error during delivery confirmation: {ex.InnerException?.Message ?? ex.Message}");
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Unexpected error during delivery confirmation: {ex.Message}");
        }
    }
}