using MediatR;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Authentication.Commands.VerifyEmail;

public record VerifyEmailCommand : IRequest<ApiResponse<bool>>
{
    public Guid UserId { get; set; }
    public string Otp { get; set; } = null!;
}

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, ApiResponse<bool>>
{
    private readonly IIdentityService _identityService;
    private readonly IApplicationDbContext _context;

    public VerifyEmailCommandHandler(
        IIdentityService identityService,
        IApplicationDbContext context)
    {
        _identityService = identityService;
        _context = context;
    }

    public async Task<ApiResponse<bool>> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        // Find the OTP notification for this user
        var otpNotification = await _context.Notifications
            .Where(n => n.UserId == request.UserId && 
                       n.Metadata != null && 
                       n.Metadata.Contains("\"purpose\":\"email_verification\"") &&
                       n.IsActive)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (otpNotification == null)
        {
            return ApiResponse<bool>.FailureResponse(
                "Verification code not found or has expired. Please request a new code.");
        }

        // Parse metadata to get OTP and expiry
        try
        {
            if (string.IsNullOrEmpty(otpNotification.Metadata))
            {
                return ApiResponse<bool>.FailureResponse("Invalid verification data.");
            }

            var metadata = System.Text.Json.JsonDocument.Parse(otpNotification.Metadata);
            var storedOtp = metadata.RootElement.GetProperty("otp").GetString();
            var expiryStr = metadata.RootElement.GetProperty("expiry").GetString();
            var expiry = DateTime.Parse(expiryStr!);
            
            // Get current attempt count
            var attempts = metadata.RootElement.TryGetProperty("attempts", out var attemptsElement) 
                ? attemptsElement.GetInt32() 
                : 0;

            // Check if expired
            if (DateTime.UtcNow > expiry)
            {
                otpNotification.IsActive = false;
                await _context.SaveChangesAsync(cancellationToken);
                
                return ApiResponse<bool>.FailureResponse(
                    "Verification code has expired. Please request a new code.");
            }

            // Check attempt limit
            if (attempts >= 5)
            {
                otpNotification.IsActive = false;
                await _context.SaveChangesAsync(cancellationToken);
                
                return ApiResponse<bool>.FailureResponse(
                    "Too many failed attempts. Please request a new verification code.");
            }

            // Verify OTP
            if (storedOtp != request.Otp)
            {
                // Increment attempt count
                var newMetadata = otpNotification.Metadata.Replace(
                    $"\"attempts\":{attempts}",
                    $"\"attempts\":{attempts + 1}");
                otpNotification.Metadata = newMetadata;
                await _context.SaveChangesAsync(cancellationToken);
                
                var remainingAttempts = 5 - (attempts + 1);
                return ApiResponse<bool>.FailureResponse(
                    $"Invalid verification code. {remainingAttempts} attempt(s) remaining.");
            }

            // OTP is valid - mark as verified and deactivate the notification
            otpNotification.IsActive = false;
            otpNotification.Status = YaqeenPay.Domain.Enums.NotificationStatus.Read;
            
            // Mark email as confirmed using Identity's method
            // Since we don't have a token, we'll manually update the user
            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
            if (user == null)
            {
                return ApiResponse<bool>.FailureResponse("User not found.");
            }

            user.EmailConfirmed = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.SuccessResponse(true, 
                "Email verified successfully! You can now log in to your account.");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.FailureResponse(
                $"Failed to verify email: {ex.Message}");
        }
    }
}
