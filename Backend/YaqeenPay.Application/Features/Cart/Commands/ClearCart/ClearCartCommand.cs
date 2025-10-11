using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Cart.Commands.ClearCart;

public record ClearCartCommand : IRequest<ApiResponse<Unit>>
{
}

public class ClearCartCommandHandler : IRequestHandler<ClearCartCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ClearCartCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var cartItems = await _context.CartItems
            .Where(ci => ci.UserId == userId)
            .ToListAsync(cancellationToken);

        if (cartItems.Any())
        {
            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Cart cleared successfully.");
    }
}