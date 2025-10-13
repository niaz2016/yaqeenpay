using FluentValidation;
using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Authentication.Commands.Register;

public record RegisterCommand : IRequest<ApiResponse<Guid>>
{
    public string Email { get; set; } = null!;
    public string UserName { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string ConfirmPassword { get; set; } = null!;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "buyer"; // Default to buyer
}

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not in a valid format.");

        RuleFor(v => v.UserName)
            .NotEmpty().WithMessage("Username is required.")
            .MinimumLength(3).WithMessage("Username must be at least 3 characters.");

        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

        RuleFor(v => v.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Passwords don't match.");

        RuleFor(v => v.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => role.ToLower() == "buyer" || role.ToLower() == "seller")
            .WithMessage("Role must be either 'buyer' or 'seller'.");
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, ApiResponse<Guid>>
{
    private readonly IIdentityService _identityService;

    public RegisterCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<ApiResponse<Guid>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var result = await _identityService.CreateUserAsync(
            request.UserName,
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.PhoneNumber);

        if (!result.Result.Succeeded)
        {
            return ApiResponse<Guid>.FailureResponse("Failed to create user", [.. result.Result.Errors]);
        }

        // Assign role to user (capitalize first letter to match enum)
        var role = char.ToUpper(request.Role[0]) + request.Role.Substring(1).ToLower();
        var roleResult = await _identityService.AddUserToRoleAsync(result.UserId, role);

        if (!roleResult.Succeeded)
        {
            // User was created but role assignment failed - log this but don't fail the registration
            // In production, you might want to handle this differently
            return ApiResponse<Guid>.SuccessResponse(result.UserId, $"User created successfully but role assignment failed: {string.Join(", ", roleResult.Errors)}");
        }

        return ApiResponse<Guid>.SuccessResponse(result.UserId, "User created successfully");
    }
}