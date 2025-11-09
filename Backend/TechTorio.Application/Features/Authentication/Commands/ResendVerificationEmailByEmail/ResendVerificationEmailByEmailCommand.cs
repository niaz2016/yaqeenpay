using MediatR;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Authentication.Commands.ResendVerificationEmailByEmail;

public record ResendVerificationEmailByEmailCommand : IRequest<ApiResponse<bool>>
{
    public string Email { get; set; } = null!;
}

public class ResendVerificationEmailByEmailCommandHandler : IRequestHandler<ResendVerificationEmailByEmailCommand, ApiResponse<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ResendVerificationEmailByEmailCommandHandler(
        IApplicationDbContext context,
        IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<ApiResponse<bool>> Handle(ResendVerificationEmailByEmailCommand request, CancellationToken cancellationToken)
    {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            
        if (user == null)
        {
            // Don't reveal that user doesn't exist for security
            return ApiResponse<bool>.SuccessResponse(true, 
                "If an account exists with this email, a verification code has been sent.");
        }

        // Check if user is already verified
        if (user.EmailConfirmed)
        {
            return ApiResponse<bool>.FailureResponse("Email is already verified.");
        }

        // Check rate limiting - prevent sending too many emails
        var recentEmailCount = await _context.Notifications
            .Where(n => n.UserId == user.Id &&
                       n.Metadata != null &&
                       n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                       n.CreatedAt > DateTime.UtcNow.AddMinutes(-5))
            .CountAsync(cancellationToken);

        if (recentEmailCount >= 3)
        {
            return ApiResponse<bool>.FailureResponse(
                "Too many verification emails requested. Please wait 5 minutes before trying again.");
        }

        // Deactivate any existing active verification notifications
        var existingNotifications = await _context.Notifications
            .Where(n => n.UserId == user.Id &&
                       n.Metadata != null &&
                       n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                       n.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var notification in existingNotifications)
        {
            notification.IsActive = false;
        }

        // Generate verification token for email verification link
        var verificationToken = GenerateVerificationToken();
        var tokenExpiry = DateTime.UtcNow.AddHours(24); // 24 hour expiry for verification link

        // Create new verification notification
        var verificationNotification = new TechTorio.Domain.Entities.Notification
        {
            UserId = user.Id,
            Type = TechTorio.Domain.Enums.NotificationType.Security,
            Title = "Email Verification Link",
            Message = $"Please verify your email address by clicking the verification link sent to your email.",
            Priority = TechTorio.Domain.Enums.NotificationPriority.High,
            Status = TechTorio.Domain.Enums.NotificationStatus.Unread,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.Empty,
            IsActive = true,
            Metadata = $"{{\"token\":\"{verificationToken}\",\"purpose\":\"email_verification\",\"expiry\":\"{tokenExpiry:O}\"}}"
        };

        _context.Notifications.Add(verificationNotification);
        await _context.SaveChangesAsync(cancellationToken);

        // Send verification link via email
        try
        {
            var userName = user.FirstName ?? user.UserName ?? "User";
            var baseUrl = (Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost").TrimEnd('/');
            var verificationBase = baseUrl.EndsWith("/techtorio", StringComparison.OrdinalIgnoreCase)
                ? baseUrl
                : baseUrl + "/techtorio";
            var verificationLink = $"{verificationBase}/auth/verify-email?userId={user.Id}&token={Uri.EscapeDataString(verificationToken)}";
            
            var emailSubject = "TechTorio - Verification Link";
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
            <h1>Email Verification</h1>
        </div>
        <div class=""content"">
            <h2>Hello {userName},</h2>
            <p>You requested a verification link for your TechTorio account. Click the button below to verify your email address:</p>
            
            <div style=""text-align: center;"">
                <a href=""{verificationLink}"" class=""button"">Verify Email Address</a>
            </div>
            
            <div class=""warning"">
                <strong>Important:</strong> This verification link will expire in 24 hours. If you didn't request this link, please ignore this email.
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <p class=""alt-link"">{verificationLink}</p>
            
            <p>If you continue to have issues, please contact our support team.</p>
        </div>
        <div class=""footer"">
            <p>&copy; 2025 TechTorio. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
        </div>
    </div>
</body>
</html>";

            var plainTextBody = $@"
Email Verification

Hello {userName},

You requested a verification link for your TechTorio account. Click the link below to verify your email address:

{verificationLink}

IMPORTANT: This verification link will expire in 24 hours. If you didn't request this link, please ignore this email.

If you continue to have issues, please contact our support team.

© 2025 TechTorio. All rights reserved.
";

            await _emailService.SendEmailAsync(user.Email!, emailSubject, htmlBody, plainTextBody);
            
            return ApiResponse<bool>.SuccessResponse(true, 
                "Verification link has been sent. Please check your email.");
        }
        catch (Exception ex)
        {
            // Log the error
            Console.WriteLine($"Failed to send verification email: {ex.Message}");
            return ApiResponse<bool>.FailureResponse(
                "Failed to send verification email. Please try again later.");
        }
    }

    private string GenerateVerificationToken()
    {
        // Generate a secure random token
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }
}
