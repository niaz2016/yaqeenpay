using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;
using YaqeenPay.Domain.ValueObjects;

namespace YaqeenPay.Application.Features.Escrows.Commands.CreateEscrow;

public record CreateEscrowCommand : IRequest<ApiResponse<Guid>>
{
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "PKR";
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid BuyerId { get; set; }
    public Guid SellerId { get; set; }
}

public class CreateEscrowCommandValidator : AbstractValidator<CreateEscrowCommand>
{
    public CreateEscrowCommandValidator()
    {
        RuleFor(v => v.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(v => v.Currency)
            .NotEmpty().WithMessage("Currency is required.");

        RuleFor(v => v.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(v => v.BuyerId)
            .NotEmpty().WithMessage("Buyer ID is required.");

        RuleFor(v => v.SellerId)
            .NotEmpty().WithMessage("Seller ID is required.");
    }
}

public class CreateEscrowCommandHandler : IRequestHandler<CreateEscrowCommand, ApiResponse<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CreateEscrowCommandHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<Guid>> Handle(CreateEscrowCommand request, CancellationToken cancellationToken)
    {
        // Check if users exist
        var buyerExists = await _context.Users
            .AnyAsync(u => u.Id == request.BuyerId, cancellationToken);
        
        var sellerExists = await _context.Users
            .AnyAsync(u => u.Id == request.SellerId, cancellationToken);

        if (!buyerExists || !sellerExists)
        {
            return ApiResponse<Guid>.FailureResponse("Buyer or seller not found");
        }

        // Create new escrow
        var money = new Money(request.Amount, request.Currency);
        var escrow = new Escrow(
            money,
            request.BuyerId,
            request.SellerId,
            request.Title,
            request.Description);

        _context.Escrows.Add(escrow);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<Guid>.SuccessResponse(escrow.Id, "Escrow created successfully");
    }
}