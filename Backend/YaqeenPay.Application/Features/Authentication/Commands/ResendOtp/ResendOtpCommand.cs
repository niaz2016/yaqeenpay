using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Authentication.Commands.ResendOtp;

public record ResendOtpCommand : IRequest<ApiResponse<ResendOtpResponse>>
{
    public Guid UserId { get; set; }
    public Guid DeviceId { get; set; }
}

public record ResendOtpResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int RemainingAttempts { get; set; }
    public DateTime NextAllowedAt { get; set; }
}

public class ResendOtpCommandValidator : AbstractValidator<ResendOtpCommand>
{
    public ResendOtpCommandValidator()
    {
        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.");
        
        RuleFor(v => v.DeviceId)
            .NotEmpty().WithMessage("Device ID is required.");
    }
}

public class ResendOtpCommandHandler : IRequestHandler<ResendOtpCommand, ApiResponse<ResendOtpResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly ISmsSender _smsSender;
    private const int MaxOtpAttempts = 3;
    private const int ResendCooldownSeconds = 60; // 1 minute

    public ResendOtpCommandHandler(
        IApplicationDbContext context,
        ISmsSender smsSender)
    {
        _context = context;
        _smsSender = smsSender;
    }

    public async Task<ApiResponse<ResendOtpResponse>> Handle(ResendOtpCommand request, CancellationToken cancellationToken)
    {
        // Find the most recent OTP notification for this device
        var otpNotification = await _context.Notifications
            .Where(n => n.UserId == request.UserId && 
                       n.Type == Domain.Enums.NotificationType.Security &&
                       n.Title == "Device Verification Required" &&
                       n.IsActive)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (otpNotification == null || string.IsNullOrEmpty(otpNotification.Metadata))
        {
            return ApiResponse<ResendOtpResponse>.FailureResponse("No pending OTP request found.");
        }

        // Parse metadata
        try
        {
            var metadata = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(otpNotification.Metadata);
            if (metadata == null || !metadata.ContainsKey("deviceId"))
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse("Invalid OTP data.");
            }

            // Verify device ID matches
            var deviceIdStr = metadata["deviceId"].GetString();
            if (deviceIdStr != request.DeviceId.ToString())
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse("Device mismatch.");
            }

            // Check OTP expiry
            var expiryStr = metadata["expiry"].GetString();
            if (!DateTime.TryParse(expiryStr, out var expiry) || DateTime.UtcNow > expiry)
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse("OTP session has expired. Please login again.");
            }

            // Check attempts
            var attempts = metadata.ContainsKey("attempts") ? metadata["attempts"].GetInt32() : 0;
            if (attempts >= MaxOtpAttempts)
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse($"Maximum OTP send attempts ({MaxOtpAttempts}) reached. Please login again.");
            }

            // Check cooldown period
            var lastSentAtStr = metadata.ContainsKey("lastSentAt") ? metadata["lastSentAt"].GetString() : null;
            if (!string.IsNullOrEmpty(lastSentAtStr) && DateTime.TryParse(lastSentAtStr, out var lastSentAt))
            {
                var timeSinceLastSend = DateTime.UtcNow - lastSentAt;
                if (timeSinceLastSend.TotalSeconds < ResendCooldownSeconds)
                {
                    var nextAllowedAt = lastSentAt.AddSeconds(ResendCooldownSeconds);
                    var remainingSeconds = (int)(nextAllowedAt - DateTime.UtcNow).TotalSeconds;
                    return ApiResponse<ResendOtpResponse>.SuccessResponse(
                        new ResendOtpResponse
                        {
                            Success = false,
                            Message = $"Please wait {remainingSeconds} seconds before requesting a new OTP.",
                            RemainingAttempts = MaxOtpAttempts - attempts,
                            NextAllowedAt = nextAllowedAt
                        },
                        $"Please wait {remainingSeconds} seconds before requesting a new OTP.");
                }
            }

            // Get user
            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
            if (user == null || string.IsNullOrEmpty(user.PhoneNumber))
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse("User not found or phone number not set.");
            }

            // Get OTP from metadata
            var otp = metadata["otp"].GetString();
            if (string.IsNullOrEmpty(otp))
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse("Invalid OTP data.");
            }

            // Update metadata with new attempt count and last sent timestamp
            var newAttempts = attempts + 1;
            var newLastSentAt = DateTime.UtcNow;
            metadata["attempts"] = JsonSerializer.SerializeToElement(newAttempts);
            metadata["lastSentAt"] = JsonSerializer.SerializeToElement(newLastSentAt.ToString("O"));

            otpNotification.Metadata = JsonSerializer.Serialize(metadata);
            otpNotification.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            // Send SMS
            try
            {
                await _smsSender.SendOtpAsync(user.PhoneNumber, otp, cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                return ApiResponse<ResendOtpResponse>.FailureResponse($"Failed to send SMS: {ex.Message}");
            }

            return ApiResponse<ResendOtpResponse>.SuccessResponse(
                new ResendOtpResponse
                {
                    Success = true,
                    Message = "OTP resent successfully.",
                    RemainingAttempts = MaxOtpAttempts - newAttempts,
                    NextAllowedAt = newLastSentAt.AddSeconds(ResendCooldownSeconds)
                },
                "OTP resent successfully.");
        }
        catch (Exception ex)
        {
            return ApiResponse<ResendOtpResponse>.FailureResponse($"Error processing request: {ex.Message}");
        }
    }
}
