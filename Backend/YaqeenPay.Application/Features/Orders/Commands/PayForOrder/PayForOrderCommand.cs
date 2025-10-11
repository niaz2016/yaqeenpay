using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace YaqeenPay.Application.Features.Orders.Commands.PayForOrder;

public class PayForOrderCommand : IRequest<PayForOrderResponse>
{
    public Guid OrderId { get; set; }
}

public class PayForOrderResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
    public decimal FrozenAmount { get; set; }
    public string Currency { get; set; } = string.Empty;
}

public class PayForOrderCommandHandler : IRequestHandler<PayForOrderCommand, PayForOrderResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public PayForOrderCommandHandler(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PayForOrderResponse> Handle(PayForOrderCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == Guid.Empty)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = "User not authenticated"
            };
        }

        // Get the order
        var order = await _context.Orders
            .Include(o => o.Buyer)
            .Include(o => o.Seller)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = "Order not found"
            };
        }

        // Verify the current user is the buyer
        if (order.BuyerId != currentUserId)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = "Only the buyer can pay for this order"
            };
        }

        // Check if order is in correct status for payment
        if (order.Status != Domain.Enums.OrderStatus.Created && order.Status != Domain.Enums.OrderStatus.PaymentPending)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = $"Cannot pay for order in status {order.Status}"
            };
        }

        // Get buyer's wallet
        var wallet = await _context.Wallets
            .FirstOrDefaultAsync(w => w.UserId == currentUserId, cancellationToken);

        if (wallet == null)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = "Buyer wallet not found"
            };
        }

        // Check if buyer has sufficient funds
        if (!wallet.HasSufficientFunds(order.Amount))
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = $"Insufficient funds. Available: {wallet.GetAvailableBalance().Amount}, Required: {order.Amount.Amount}"
            };
        }

        try
        {
            // Mark payment pending if not already
            if (order.Status == Domain.Enums.OrderStatus.Created)
            {
                order.MarkPaymentPending();
            }

            // Freeze the amount in buyer's wallet
            wallet.FreezeAmount(order.Amount, $"Payment for order {order.Id}");

            // Confirm payment on the order
            order.ConfirmPayment(order.Amount);

            await _context.SaveChangesAsync(cancellationToken);

            return new PayForOrderResponse
            {
                Success = true,
                Message = "Payment successful. Amount frozen in your wallet.",
                OrderId = order.Id,
                FrozenAmount = order.FrozenAmount!.Amount,
                Currency = order.FrozenAmount!.Currency
            };
        }
        catch (Exception ex)
        {
            return new PayForOrderResponse
            {
                Success = false,
                Message = ex.Message
            };
        }
    }
}