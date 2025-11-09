using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text.Json;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Application.Features.Authentication.Commands.Login;

namespace TechTorio.Application.Features.Authentication.Commands.VerifyDevice;

public record VerifyDeviceCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public Guid UserId { get; set; }
    public Guid DeviceId { get; set; }
    public string Otp { get; set; } = string.Empty;
}

public class VerifyDeviceCommandValidator : AbstractValidator<VerifyDeviceCommand>
{
    public VerifyDeviceCommandValidator()
    {
        RuleFor(v => v.UserId)
            .NotEmpty().WithMessage("User ID is required.");
        
        RuleFor(v => v.DeviceId)
            .NotEmpty().WithMessage("Device ID is required.");
        
        RuleFor(v => v.Otp)
            .NotEmpty().WithMessage("OTP is required.")
            .Length(6).WithMessage("OTP must be 6 digits.");
    }
}

public class VerifyDeviceCommandHandler : IRequestHandler<VerifyDeviceCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IDeviceService _deviceService;
    private readonly IJwtService _jwtService;
    private readonly IIdentityService _identityService;
    private readonly IConfiguration _configuration;

    public VerifyDeviceCommandHandler(
        IApplicationDbContext context,
        IDeviceService deviceService,
        IJwtService jwtService,
        IIdentityService identityService,
        IConfiguration configuration)
    {
        _context = context;
        _deviceService = deviceService;
        _jwtService = jwtService;
        _identityService = identityService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<AuthenticationResponse>> Handle(VerifyDeviceCommand request, CancellationToken cancellationToken)
    {
        // Check if device verification is enabled
        var deviceVerificationEnabled = _configuration["DeviceVerification:Enabled"] != "false";
        if (!deviceVerificationEnabled)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse(
                "Device verification is currently disabled. This endpoint is not available.");
        }

        // Find the OTP notification for this device
        var otpNotification = await _context.Notifications
            .Where(n => n.UserId == request.UserId && 
                       n.Type == TechTorio.Domain.Enums.NotificationType.Security &&
                       n.Title == "Device Verification Required" &&
                       n.IsActive)
            .OrderByDescending(n => n.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (otpNotification == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("OTP not found or expired.");
        }

        // Parse metadata
        if (string.IsNullOrEmpty(otpNotification.Metadata))
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid OTP data.");
        }

        try
        {
            var metadata = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(otpNotification.Metadata);
            if (metadata == null || !metadata.ContainsKey("otp") || !metadata.ContainsKey("deviceId") || !metadata.ContainsKey("expiry"))
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid OTP data.");
            }

            var storedOtp = metadata["otp"].GetString();
            var deviceIdStr = metadata["deviceId"].GetString();
            var expiryStr = metadata["expiry"].GetString();

            // Verify device ID matches
            if (deviceIdStr != request.DeviceId.ToString())
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("Device mismatch.");
            }

            // Check expiry
            if (!DateTime.TryParse(expiryStr, out var expiry) || DateTime.UtcNow > expiry)
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("OTP has expired.");
            }

            // Verify OTP
            if (storedOtp != request.Otp)
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid OTP.");
            }

            // Mark device as verified
            await _deviceService.VerifyDeviceAsync(request.DeviceId, cancellationToken);

            // Mark notification as read
            otpNotification.Status = TechTorio.Domain.Enums.NotificationStatus.Read;
            await _context.SaveChangesAsync(cancellationToken);

            // Get user and generate tokens
            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
            if (user == null)
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse("User not found.");
            }

            var roles = await _identityService.GetUserRolesAsync(user.Id);
            var ipAddress = "127.0.0.1"; // Will be captured from HTTP context in actual request
            var (jwtToken, refreshToken) = _jwtService.GenerateTokens(user, roles, ipAddress);

            // Save refresh token
            user.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Send notification about new device login
            var deviceInfo = await _context.UserDevices.FindAsync(new object[] { request.DeviceId }, cancellationToken);
            var newDeviceNotification = new TechTorio.Domain.Entities.Notification
            {
                UserId = user.Id,
                Type = TechTorio.Domain.Enums.NotificationType.Security,
                Title = "New device verified",
                Message = $"A new device has been verified and added to your account: {deviceInfo?.Browser ?? "Unknown"} on {deviceInfo?.OperatingSystem ?? "Unknown"}",
                Priority = TechTorio.Domain.Enums.NotificationPriority.Medium,
                Status = TechTorio.Domain.Enums.NotificationStatus.Unread,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = user.Id,
                IsActive = true
            };

            _context.Notifications.Add(newDeviceNotification);
            await _context.SaveChangesAsync(cancellationToken);

            return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
            {
                Token = jwtToken,
                RefreshToken = refreshToken.Token,
                TokenExpires = refreshToken.ExpiresAt,
                UserId = user.Id,
                Email = user.Email!,
                UserName = user.UserName!,
                RequiresDeviceVerification = false,
                IsNewUser = false
            }, "Device verified successfully.");
        }
        catch (Exception ex)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse($"Error verifying device: {ex.Message}");
        }
    }
}
