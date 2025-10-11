using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Orders.Commands.ConfirmShipped;

public record ConfirmShippedCommand(Guid OrderId, Guid UserId) : IRequest<bool>;

public class ConfirmShippedCommandHandler : IRequestHandler<ConfirmShippedCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ConfirmShippedCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ConfirmShippedCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {request.OrderId} not found.");
        }

        // Verify that the user is the seller
        if (order.SellerId != request.UserId)
        {
            throw new UnauthorizedAccessException("Only the seller can confirm shipment.");
        }

        try
        {
            order.ConfirmShipment();
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (InvalidOperationException ex)
        {
            throw new InvalidOperationException($"Cannot confirm shipment: {ex.Message}");
        }
    }
}