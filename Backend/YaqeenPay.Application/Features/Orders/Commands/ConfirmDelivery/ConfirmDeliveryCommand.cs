using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.Enums;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.ConfirmDelivery;

public record ConfirmDeliveryCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

/// <summary>
/// Handles buyer's confirmation of delivery.
/// 
/// PAYMENT FLOW:
/// 1. Payment (/orders/{orderId}/pay):
///    - Freezes funds in buyer's wallet (available ? frozen)
///    - Order status: Created ? PaymentPending ? AwaitingShipment
///    - Sets order.IsAmountFrozen = true
/// 
/// 2. Shipment (/orders/{orderId}/ship):
///    - Seller marks as shipped
///    - Order status: AwaitingShipment ? Shipped
///    - Funds remain frozen in buyer's wallet
/// 
/// 3. Delivery Confirmation (/orders/{orderId}/confirm-delivery) - THIS HANDLER:
///    - Buyer confirms receipt
///    - Transfers frozen funds: buyer frozen ? debit, seller available ? credit
///    - Order status: Shipped/DeliveredPendingDecision ? Completed
///    - Does NOT freeze funds again - they're already frozen from step 1
/// </summary>
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
        // Buyer can confirm delivery when order is Shipped or DeliveredPendingDecision
        if (order.Status != OrderStatus.Shipped && order.Status != OrderStatus.DeliveredPendingDecision)
        {
            throw new InvalidOperationException($"Cannot confirm delivery for order in status {order.Status}. Order must be shipped or delivered first.");
        }

        if (!order.IsAmountFrozen || order.FrozenAmount == null)
        {
            throw new InvalidOperationException("No frozen amount found for this order. Payment must be completed before confirming delivery.");
        }

        try
        {
            // If seller hasn't marked as delivered yet, do it now (for MVP without shipper integration)
            // This changes status from Shipped -> DeliveredPendingDecision
            if (order.Status == OrderStatus.Shipped)
            {
                order.MarkAsDelivered();
            }

            // Get buyer's wallet to transfer the frozen funds OUT
            var buyerWallet = await _context.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.UserId == order.BuyerId, cancellationToken);

            if (buyerWallet == null)
            {
                throw new InvalidOperationException($"Buyer wallet not found for user ID: {order.BuyerId}");
            }

            // Get the seller's wallet to transfer the funds IN
            var sellerWallet = await _context.Wallets
                .Include(w => w.Transactions)
                .FirstOrDefaultAsync(w => w.UserId == order.SellerId, cancellationToken);

            if (sellerWallet == null)
            {
                throw new InvalidOperationException($"Seller wallet not found for user ID: {order.SellerId}");
            }

            // Get the amount that was frozen during payment
            var transferAmount = order.FrozenAmount;
            
            if (transferAmount == null)
            {
                throw new InvalidOperationException($"Order {order.Id} has no frozen amount set. Payment must be completed first.");
            }
            
            // Verify buyer has the frozen funds available; if not, attempt reconciliation
            var required = transferAmount.Amount;
            var currentFrozen = buyerWallet.FrozenBalance.Amount;

            if (currentFrozen < required)
            {
                // Try to find freeze transactions linked to this order
                var referencedFreezeSum = buyerWallet.Transactions
                    .Where(t => t.ReferenceId == order.Id && t.Type == TransactionType.Freeze)
                    .Sum(t => t.Amount.Amount);

                var referencedUnfreezeSum = buyerWallet.Transactions
                    .Where(t => t.ReferenceId == order.Id && (t.Type == TransactionType.Unfreeze || t.Type == TransactionType.FrozenToDebit))
                    .Sum(t => t.Amount.Amount);

                var netReferencedFrozen = referencedFreezeSum - referencedUnfreezeSum;

                if (netReferencedFrozen >= required)
                {
                    // Wallet's FrozenBalance seems stale — try to bring it in sync by creating a freeze for the delta
                    var delta = netReferencedFrozen - currentFrozen;
                    if (delta > 0)
                    {
                        // Ensure wallet has available funds to cover the delta
                        var available = buyerWallet.GetAvailableBalance().Amount;
                        if (available >= delta)
                        {
                            buyerWallet.FreezeAmount(new Money(delta, transferAmount.Currency), $"Reconcile freeze for order {order.Id}", order.Id, "Order");
                        }
                        else
                        {
                            // Cannot auto-reconcile due to insufficient available funds
                            throw new InvalidOperationException($"Order marked as paid but buyer wallet frozen balance is inconsistent. Required frozen: {required}, wallet frozen: {currentFrozen}, referenced frozen sum: {netReferencedFrozen}. Available to reconcile: {available}. Manual review required.");
                        }
                    }
                }
                else
                {
                    // No referenced freeze found or insufficient referenced freezes — attempt to freeze now if buyer still has available balance
                    var availableNow = buyerWallet.GetAvailableBalance().Amount;
                    if (availableNow >= required)
                    {
                        // Freeze now and link to order (best-effort recovery)
                        buyerWallet.FreezeAmount(transferAmount, $"Reconcile payment freeze for order {order.Id}", order.Id, "Order");
                    }
                    else
                    {
                        throw new InvalidOperationException($"Insufficient frozen funds in buyer wallet. Required: {required}, Available frozen: {currentFrozen}, Available to freeze now: {availableNow}. Order and wallet state are inconsistent — investigate payment flow or recent wallet activity.");
                    }
                }
            }

            // Refresh current frozen amount after reconciliation attempts
            currentFrozen = buyerWallet.FrozenBalance.Amount;
            if (currentFrozen < required)
            {
                throw new InvalidOperationException($"Insufficient frozen funds in buyer wallet after reconciliation attempt. Required: {required}, Available frozen: {currentFrozen}");
            }

            // Step 1: Remove frozen funds from buyer (both frozen balance AND total balance)
            // This is NOT freezing again - it's removing already-frozen funds
            buyerWallet.TransferFrozenToDebit(transferAmount, $"Payment completed for order {order.Id}", order.Id, "Order");

            // Step 2: Credit the seller's available balance
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