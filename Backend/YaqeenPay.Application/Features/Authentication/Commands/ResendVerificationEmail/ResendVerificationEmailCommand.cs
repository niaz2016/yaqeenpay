using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Authentication.Commands.ResendVerificationEmail;
public record ResendVerificationEmailCommand : IRequest<ApiResponse<bool>>
{
    public Guid UserId { get; set; }
}

public class ResendVerificationEmailCommandHandler : IRequestHandler<ResendVerificationEmailCommand, ApiResponse<bool>>
{
    private readonly IIdentityService _identityService;
    private readonly IApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public ResendVerificationEmailCommandHandler(
        IIdentityService identityService,
        IApplicationDbContext context,
        IEmailService emailService)
    {
        _identityService = identityService;
        _context = context;
        _emailService = emailService;
    }

    public async Task<ApiResponse<bool>> Handle(ResendVerificationEmailCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
            return ApiResponse<bool>.FailureResponse("User not found.");

        if (user.EmailConfirmed)
            return ApiResponse<bool>.FailureResponse("Email is already verified.");

        var recentEmailCount = await _context.Notifications
            .Where(n => n.UserId == request.UserId &&
                        n.Metadata != null &&
                        n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                        n.CreatedAt > DateTime.UtcNow.AddMinutes(-5))
            .CountAsync(cancellationToken);

        if (recentEmailCount >= 3)
        {
            return ApiResponse<bool>.FailureResponse(
                "Too many verification emails requested. Please wait 5 minutes before trying again.");
        }

        var existingNotifications = await _context.Notifications
            .Where(n => n.UserId == request.UserId &&
                        n.Metadata != null &&
                        n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                        n.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var notification in existingNotifications)
            notification.IsActive = false;

        var verificationToken = GenerateVerificationToken();
        var tokenExpiry = DateTime.UtcNow.AddHours(24);

        var verificationNotification = new YaqeenPay.Domain.Entities.Notification
        {
            UserId = request.UserId,
            Type = YaqeenPay.Domain.Enums.NotificationType.Security,
            Title = "Email Verification Link",
            Message = "Please verify your email address by clicking the verification link.",
            Priority = YaqeenPay.Domain.Enums.NotificationPriority.High,
            Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = Guid.Empty,
            IsActive = true,
              Metadata = $"{{\"token\":\"{verificationToken}\",\"purpose\":\"email_verification\",\"expiry\":\"{tokenExpiry:O}\"}}"
        };

        _context.Notifications.Add(verificationNotification);
        await _context.SaveChangesAsync(cancellationToken);

        try
        {
            var userName = user.FirstName ?? user.UserName ?? "User";
            var baseUrl = (Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "http://localhost").TrimEnd('/');
            var verificationBase = baseUrl.EndsWith("/yaqeenpay", StringComparison.OrdinalIgnoreCase)
                ? baseUrl
                : baseUrl + "/yaqeenpay";
            var verificationLink = $"{verificationBase}/auth/verify-email?userId={request.UserId}&token={Uri.EscapeDataString(verificationToken)}";

            var subject = "YaqeenPay - Verify your email";

            var htmlBody = $@"<!DOCTYPE html>
<html>
<head>
  <meta charset='utf-8' />
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
    .content {{ background-color: #f9f9f9; padding: 30px; }}
    .button {{ display: inline-block; padding: 12px 22px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }}
    .footer {{ text-align: center; padding: 16px; font-size: 12px; color: #666; }}
    .alt {{ color: #666; font-size: 12px; word-break: break-all; }}
  </style>
</head>
<body>
  <div class='container'>
    <div class='header'><h1>Email Verification</h1></div>
    <div class='content'>
      <p>Hello {userName},</p>
      <p>Click the button below to verify your email address:</p>
      <p style='text-align:center;'><a class='button' href='{verificationLink}'>Verify Email</a></p>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p class='alt'>{verificationLink}</p>
      <p>This link expires in 24 hours.</p>
    </div>
    <div class='footer'>&copy; 2025 YaqeenPay</div>
  </div>
</body>
</html>";

            var textBody = $@"Hello {userName},

Please verify your email address by opening this link:
{verificationLink}

This link expires in 24 hours.

— YaqeenPay";

            await _emailService.SendEmailAsync(user.Email!, subject, htmlBody, textBody);
            return ApiResponse<bool>.SuccessResponse(true, "Verification link has been resent. Please check your email.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send verification email: {ex.Message}");
            return ApiResponse<bool>.FailureResponse("Failed to send verification email. Please try again later or contact support.");
        }
    }

    private static string GenerateVerificationToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }
}
