using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
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
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IApplicationDbContext _context;

    public RegisterCommandHandler(
        IIdentityService identityService,
        IEmailService emailService,
        IConfiguration configuration,
        IApplicationDbContext context)
    {
        _identityService = identityService;
        _emailService = emailService;
        _configuration = configuration;
        _context = context;
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

        // Generate verification token for email verification link
        var verificationToken = GenerateVerificationToken();
        var tokenExpiry = DateTime.UtcNow.AddHours(24); // 24 hour expiry for verification link
        
        // Store token in notification for verification
        var verificationNotification = new YaqeenPay.Domain.Entities.Notification
        {
            UserId = result.UserId,
            Type = YaqeenPay.Domain.Enums.NotificationType.Security,
            Title = "Email Verification Link",
            Message = $"Please verify your email address by clicking the verification link sent to your email.",
            Priority = YaqeenPay.Domain.Enums.NotificationPriority.High,
            Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.Empty,
            IsActive = true,
            Metadata = $"{{\"token\":\"{verificationToken}\",\"purpose\":\"email_verification\",\"expiry\":\"{tokenExpiry:O}\"}}"
        };

        _context.Notifications.Add(verificationNotification);
        await _context.SaveChangesAsync(cancellationToken);
        
        // Send verification email
        try
        {
            var userName = request.FirstName ?? request.UserName;
            var emailSubject = "Verify Your YaqeenPay Account";
            
            // Build verification link - adjust URL based on environment
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost";
            var verificationLink = $"{frontendUrl}/yaqeenpay/auth/verify-email?userId={result.UserId}&token={Uri.EscapeDataString(verificationToken)}";
            
            var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; }}
        .button {{ display: inline-block; padding: 15px 30px; background-color: #4CAF50; color: white; 
                   text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
        .button:hover {{ background-color: #45a049; }}
        .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
        .warning {{ background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }}
        .alt-link {{ color: #666; font-size: 12px; word-break: break-all; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Welcome to YaqeenPay!</h1>
        </div>
        <div class=""content"">
            <h2>Hello {userName},</h2>
            <p>Thank you for registering with YaqeenPay. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
            
            <div style=""text-align: center;"">
                <a href=""{verificationLink}"" class=""button"">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <div class=""warning"">
                <strong>Important:</strong> If you didn't create an account with YaqeenPay, please ignore this email. Your email address will not be used without verification.
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p class=""alt-link"">{verificationLink}</p>
            
            <p>If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class=""footer"">
            <p>&copy; 2025 YaqeenPay. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>";

            var plainTextBody = $@"
Welcome to YaqeenPay!

Hello {userName},

Thank you for registering with YaqeenPay. To complete your registration and activate your account, please verify your email address by clicking the link below:

{verificationLink}

This verification link will expire in 24 hours.

IMPORTANT: If you didn't create an account with YaqeenPay, please ignore this email. Your email address will not be used without verification.

If you have any questions, feel free to contact our support team.

© 2025 YaqeenPay. All rights reserved.
";

            await _emailService.SendEmailAsync(request.Email, emailSubject, htmlBody, plainTextBody);
        }
        catch (Exception ex)
        {
            // Log the error but don't fail registration
            Console.WriteLine($"Failed to send verification email: {ex.Message}");
        }

        return ApiResponse<Guid>.SuccessResponse(result.UserId, "User created successfully. Please check your email to verify your account.");
    }

    private string GenerateVerificationToken()
    {
        // Generate a secure random token
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }
}