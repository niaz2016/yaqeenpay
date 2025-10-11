using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Orders.Commands.CreateOrderWithSellerMobile;

public record CreateOrderWithSellerMobileCommand : IRequest<ApiResponse<Guid>>
{
    public string SellerMobileNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PKR";
    public List<string> ImageUrls { get; set; } = new List<string>();
}

public class CreateOrderWithSellerMobileCommandValidator : AbstractValidator<CreateOrderWithSellerMobileCommand>
{
    private readonly IUserLookupService _userLookupService;

    public CreateOrderWithSellerMobileCommandValidator(IUserLookupService userLookupService)
    {
        _userLookupService = userLookupService;

        RuleFor(v => v.SellerMobileNumber)
            .NotEmpty().WithMessage("Seller mobile number is required.")
            .Matches(@"^\+?[0-9]\d{7,15}$").WithMessage("Invalid mobile number format. Must be 8-16 digits, optionally starting with +.")
            .MustAsync(SellerExistsAsync).WithMessage("No seller found with this mobile number.");

        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(v => v.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Description must not exceed 2000 characters.");

        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(v => v.Currency)
            .NotEmpty().WithMessage("Currency is required.");
    }

    private async Task<bool> SellerExistsAsync(string phoneNumber, CancellationToken cancellationToken)
    {
        return await _userLookupService.PhoneNumberExistsAsync(phoneNumber);
    }
}

public class CreateOrderWithSellerMobileCommandHandler : IRequestHandler<CreateOrderWithSellerMobileCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserLookupService _userLookupService;
    private readonly YaqeenPay.Application.Interfaces.IOrderNotificationService _orderNotificationService;

    public CreateOrderWithSellerMobileCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService,
        IUserLookupService userLookupService,
        YaqeenPay.Application.Interfaces.IOrderNotificationService orderNotificationService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _userLookupService = userLookupService;
        _orderNotificationService = orderNotificationService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateOrderWithSellerMobileCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.UserId == Guid.Empty)
        {
            return ApiResponse<Guid>.FailureResponse("User not authenticated");
        }

        // Look up seller by mobile number
        var seller = await _userLookupService.GetUserByPhoneNumberAsync(request.SellerMobileNumber);
        if (seller == null)
        {
            return ApiResponse<Guid>.FailureResponse($"No seller found with mobile number {request.SellerMobileNumber}");
        }

        var buyerId = _currentUserService.UserId;
        var sellerId = seller.Id;

        // Verify seller and buyer are different
        if (buyerId == sellerId)
        {
            return ApiResponse<Guid>.FailureResponse("You cannot create an order with yourself as the seller");
        }

        // Create new escrow for this order
        var escrow = new Escrow(
            new Money(request.Amount, request.Currency),
            buyerId,
            sellerId,
            request.Title,
            request.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        // Create the order
        var order = new Order(
            buyerId,
            sellerId,
            escrow.Id,
            request.Title,
            request.Description,
            new Money(request.Amount, request.Currency),
            request.ImageUrls);

        System.Console.WriteLine($"CreateOrderWithSellerMobile: Creating order with BuyerId: {buyerId}, SellerId: {sellerId}");

        _context.Orders.Add(order);
        
        // Link the order to the escrow
        escrow.SetOrderId(order.Id);
        await _context.SaveChangesAsync(cancellationToken);

        System.Console.WriteLine($"CreateOrderWithSellerMobile: Order {order.Id} created successfully");

        // Send notifications to both buyer and seller
        try
        {
            await _orderNotificationService.NotifyOrderCreated(order);
        }
        catch (Exception ex)
        {
            // Log notification error but don't fail the order creation
            System.Console.WriteLine($"Failed to send order creation notifications: {ex.Message}");
        }

        return ApiResponse<Guid>.SuccessResponse(order.Id, "Order created successfully with seller identified by mobile number.");
    }
}