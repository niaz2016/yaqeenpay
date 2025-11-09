using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.Application.Features.Authentication.Commands.ResetPassword;

public record ResetPasswordCommand : IRequest<ApiResponse<string>>
{
    public string Token { get; set; } = null!;
    public string NewPassword { get; set; } = null!;
    public string ConfirmPassword { get; set; } = null!;
}

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(v => v.Token)
            .NotEmpty().WithMessage("Reset token is required.");

        RuleFor(v => v.NewPassword)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

        RuleFor(v => v.ConfirmPassword)
            .Equal(x => x.NewPassword).WithMessage("Passwords don't match.");
    }
}

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, ApiResponse<string>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public ResetPasswordCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<ApiResponse<string>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        // Find user by reset token
        var user = await _userManager.Users
            .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token, cancellationToken);

        if (user == null)
        {
            return ApiResponse<string>.FailureResponse(
                "Invalid or expired reset token.",
                ["The password reset link is invalid or has expired."]);
        }

        // Check if token has expired
        if (user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            return ApiResponse<string>.FailureResponse(
                "Invalid or expired reset token.",
                ["The password reset link has expired. Please request a new one."]);
        }

        // Remove existing password and set new one
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (!result.Succeeded)
        {
            return ApiResponse<string>.FailureResponse(
                "Failed to reset password.",
                result.Errors.Select(e => e.Description).ToList());
        }

        // Clear the reset token
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _userManager.UpdateAsync(user);

        return ApiResponse<string>.SuccessResponse(
            "Password has been reset successfully. You can now login with your new password.",
            "success");
    }
}
