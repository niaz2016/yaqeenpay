using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities;
using TechTorio.Domain.ValueObjects;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Orders.Commands.CreateOrderFromCart;

public record CreateOrderFromCartCommand : IRequest<ApiResponse<CreateOrderFromCartResult>>
{
    public string? DeliveryAddress { get; set; }
    public string? DeliveryNotes { get; set; }
    public List<Guid>? SelectedCartItemIds { get; set; } // If null, use all cart items
}

public record CreateOrderFromCartResult
{
    public List<OrderSummaryDto> Orders { get; set; } = new List<OrderSummaryDto>();
    public decimal TotalAmount { get; set; }
    public string Currency { get; set; } = "PKR";
    public int TotalItems { get; set; }
}

public record OrderSummaryDto
{
    public Guid OrderId { get; set; }
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public List<OrderItemSummaryDto> Items { get; set; } = new List<OrderItemSummaryDto>();
}

public record OrderItemSummaryDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}

public class CreateOrderFromCartCommandValidator : AbstractValidator<CreateOrderFromCartCommand>
{
    public CreateOrderFromCartCommandValidator()
    {
        RuleFor(v => v.DeliveryAddress)
            .MaximumLength(500).WithMessage("Delivery address must not exceed 500 characters.");

        RuleFor(v => v.DeliveryNotes)
            .MaximumLength(1000).WithMessage("Delivery notes must not exceed 1000 characters.");
    }
}

public class CreateOrderFromCartCommandHandler : IRequestHandler<CreateOrderFromCartCommand, ApiResponse<CreateOrderFromCartResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateOrderFromCartCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<CreateOrderFromCartResult>> Handle(CreateOrderFromCartCommand request, CancellationToken cancellationToken)
    {
        var buyerId = _currentUserService.UserId;

        // Get cart items (either selected ones or all)
        var cartItemsQuery = _context.CartItems
            .Include(ci => ci.Product)
                .ThenInclude(p => p.ProductImages.Where(img => img.IsPrimary))
            .Include(ci => ci.Product.Seller)
            .Where(ci => ci.UserId == buyerId);

        if (request.SelectedCartItemIds?.Any() == true)
        {
            cartItemsQuery = cartItemsQuery.Where(ci => request.SelectedCartItemIds.Contains(ci.Id));
        }

        var cartItems = await cartItemsQuery.ToListAsync(cancellationToken);

        if (!cartItems.Any())
        {
            return ApiResponse<CreateOrderFromCartResult>.FailureResponse("No items found in cart.");
        }

        // Validate all products are still available
        var unavailableItems = cartItems.Where(ci => 
            !ci.Product.IsActive || 
            ci.Product.Status != ProductStatus.Active ||
            (!ci.Product.AllowBackorders && ci.Product.StockQuantity < ci.Quantity)).ToList();

        if (unavailableItems.Any())
        {
            var unavailableNames = string.Join(", ", unavailableItems.Select(ci => ci.Product.Name));
            return ApiResponse<CreateOrderFromCartResult>.FailureResponse($"The following items are no longer available: {unavailableNames}");
        }

        // Group cart items by seller to create separate orders
        var itemsBySeller = cartItems.GroupBy(ci => ci.Product.SellerId).ToList();
        var createdOrders = new List<OrderSummaryDto>();

        using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var sellerGroup in itemsBySeller)
            {
                var sellerId = sellerGroup.Key;
                var sellerItems = sellerGroup.ToList();
                var totalAmount = sellerItems.Sum(ci => ci.UnitPrice.Amount * ci.Quantity);
                
                // Create escrow first (using 0.05 as default fee rate - 5%)
                var escrow = new Escrow(
                    buyerId,
                    sellerId,
                    new Money(totalAmount, sellerItems.First().UnitPrice.Currency),
                    0.05m // 5% fee rate
                );

                _context.Escrows.Add(escrow);
                await _context.SaveChangesAsync(cancellationToken);

                // Create order
                var orderTitle = sellerItems.Count == 1 
                    ? sellerItems.First().Product.Name 
                    : $"{sellerItems.Count} items from {sellerItems.First().Product.Seller.FirstName}";

                var orderDescription = string.Join(", ", sellerItems.Select(ci => $"{ci.Product.Name} (x{ci.Quantity})"));

                var order = new Order(
                    buyerId,
                    sellerId,
                    escrow.Id,
                    orderDescription,
                    new Money(totalAmount, sellerItems.First().UnitPrice.Currency)
                );

                order.SetTitle(orderTitle);
                
                if (!string.IsNullOrWhiteSpace(request.DeliveryAddress))
                {
                    order.SetDeliveryAddress(request.DeliveryAddress);
                }

                if (!string.IsNullOrWhiteSpace(request.DeliveryNotes))
                {
                    order.SetDeliveryNotes(request.DeliveryNotes);
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync(cancellationToken);

                // Create order items
                var orderItemSummaries = new List<OrderItemSummaryDto>();
                foreach (var cartItem in sellerItems)
                {
                    var primaryImageUrl = cartItem.Product.ProductImages.FirstOrDefault(img => img.IsPrimary)?.ImageUrl
                                       ?? cartItem.Product.ProductImages.FirstOrDefault()?.ImageUrl;

                    var orderItem = new OrderItem(
                        order.Id,
                        cartItem.ProductId,
                        cartItem.Quantity,
                        cartItem.UnitPrice,
                        cartItem.Product.Name,
                        cartItem.Product.Sku,
                        cartItem.Product.Description,
                        primaryImageUrl
                    );

                    _context.OrderItems.Add(orderItem);

                    // Update product stock
                    if (!cartItem.Product.AllowBackorders)
                    {
                        cartItem.Product.UpdateInventory(
                            cartItem.Product.StockQuantity - cartItem.Quantity,
                            cartItem.Product.AllowBackorders
                        );
                    }

                    orderItemSummaries.Add(new OrderItemSummaryDto
                    {
                        ProductId = cartItem.ProductId,
                        ProductName = cartItem.Product.Name,
                        ProductSku = cartItem.Product.Sku,
                        Quantity = cartItem.Quantity,
                        UnitPrice = cartItem.UnitPrice.Amount,
                        TotalPrice = cartItem.UnitPrice.Amount * cartItem.Quantity
                    });
                }

                createdOrders.Add(new OrderSummaryDto
                {
                    OrderId = order.Id,
                    SellerId = sellerId,
                    SellerName = $"{sellerItems.First().Product.Seller.FirstName} {sellerItems.First().Product.Seller.LastName}".Trim(),
                    Amount = totalAmount,
                    Currency = sellerItems.First().UnitPrice.Currency,
                    Items = orderItemSummaries
                });
            }

            // Remove cart items after successful order creation
            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            var result = new CreateOrderFromCartResult
            {
                Orders = createdOrders,
                TotalAmount = createdOrders.Sum(o => o.Amount),
                Currency = createdOrders.FirstOrDefault()?.Currency ?? "PKR",
                TotalItems = createdOrders.Sum(o => o.Items.Sum(i => i.Quantity))
            };

            return ApiResponse<CreateOrderFromCartResult>.SuccessResponse(result, "Orders created successfully from cart.");
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            return ApiResponse<CreateOrderFromCartResult>.FailureResponse("Failed to create orders. Please try again.");
        }
    }
}