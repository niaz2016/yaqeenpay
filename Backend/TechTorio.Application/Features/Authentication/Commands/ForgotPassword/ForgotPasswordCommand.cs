using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Features.Authentication.Commands.ForgotPassword;

public record ForgotPasswordCommand : IRequest<ApiResponse<string>>
{
    public string Email { get; set; } = null!;
}

public class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not in a valid format.");
    }
}

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, ApiResponse<string>>
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ForgotPasswordCommandHandler(
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<string>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        // Always return success to prevent email enumeration
        if (user == null)
        {
            return ApiResponse<string>.SuccessResponse(
                "If an account exists with that email, you will receive a password reset link.",
                "success");
        }

        // Rate limiting: Check if a reset was requested in the last 2 minutes
        if (user.LastPasswordResetRequestAt.HasValue)
        {
            var timeSinceLastRequest = DateTime.UtcNow - user.LastPasswordResetRequestAt.Value;
            if (timeSinceLastRequest.TotalMinutes < 2)
            {
                var remainingSeconds = (int)(120 - timeSinceLastRequest.TotalSeconds);
                return ApiResponse<string>.FailureResponse(
                    $"Please wait {remainingSeconds} seconds before requesting another password reset.",
                    [$"You can request a new password reset in {remainingSeconds} seconds."]);
            }
        }

        // Generate a random reset token
        var resetToken = Guid.NewGuid().ToString("N");
        
        // Store the token and expiry in the user entity
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(24);
        user.LastPasswordResetRequestAt = DateTime.UtcNow;
        
        await _userManager.UpdateAsync(user);

        // Create reset link
        var frontendUrl = _configuration["Frontend:Url"] ?? "https://techtorio.online/techtorio";
        var resetLink = $"{frontendUrl}/auth/reset-password?token={resetToken}";

        // Send email
        await _emailService.SendPasswordResetEmailAsync(
            user.Email!,
            resetLink,
            user.FirstName ?? user.UserName ?? "User");

        return ApiResponse<string>.SuccessResponse(
            "If an account exists with that email, you will receive a password reset link.",
            "success");
    }
}
