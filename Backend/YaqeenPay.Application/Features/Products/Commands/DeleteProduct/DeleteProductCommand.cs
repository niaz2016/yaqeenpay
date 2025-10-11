using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Products.Commands.DeleteProduct;

public record DeleteProductCommand : IRequest<ApiResponse<Unit>>
{
    public Guid Id { get; set; }
}

public class DeleteProductCommandValidator : AbstractValidator<DeleteProductCommand>
{
    public DeleteProductCommandValidator()
    {
        RuleFor(v => v.Id)
            .NotEmpty().WithMessage("Product ID is required.");
    }
}

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, ApiResponse<Unit>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public DeleteProductCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Unit>> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        var sellerId = _currentUserService.UserId;

        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.SellerId == sellerId, cancellationToken);

        if (product == null)
        {
            return ApiResponse<Unit>.FailureResponse("Product not found or you don't have permission to delete it.");
        }

        // Check if product has any pending orders
        var hasActiveOrders = await _context.OrderItems
            .AnyAsync(oi => oi.ProductId == request.Id && 
                          _context.Orders.Any(o => o.Id == oi.OrderId && 
                                                 (o.Status == Domain.Enums.OrderStatus.Created ||
                                                  o.Status == Domain.Enums.OrderStatus.PaymentConfirmed ||
                                                  o.Status == Domain.Enums.OrderStatus.Shipped)), 
                     cancellationToken);

        if (hasActiveOrders)
        {
            return ApiResponse<Unit>.FailureResponse("Cannot delete product with active orders. Please deactivate it instead.");
        }

        // Soft delete by deactivating the product instead of hard delete
        // This preserves order history and referential integrity
        product.IsActive = false;

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Unit>.SuccessResponse(Unit.Value, "Product deleted successfully.");
    }
}