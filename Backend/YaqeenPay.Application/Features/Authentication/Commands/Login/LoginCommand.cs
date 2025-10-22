using FluentValidation;
using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace YaqeenPay.Application.Features.Authentication.Commands.Login;

public record LoginCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
}

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(v => v.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email is not valid.");
        
        RuleFor(v => v.Password)
            .NotEmpty().WithMessage("Password is required.");
    }
}

public record AuthenticationResponse
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime TokenExpires { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool RequiresDeviceVerification { get; set; }
    public Guid? PendingDeviceId { get; set; }
    public bool IsNewUser { get; set; }
}

public class LoginCommandHandler(
    IApplicationDbContext context,
    IIdentityService identityService,
    IJwtService jwtService,
    ICurrentUserService currentUserService,
    IDeviceService deviceService,
    ISmsSender smsSender,
    IConfiguration configuration) : IRequestHandler<LoginCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IApplicationDbContext _context = context;
    private readonly IIdentityService _identityService = identityService;
    private readonly IJwtService _jwtService = jwtService;
    private readonly ICurrentUserService _currentUserService = currentUserService;
    private readonly IDeviceService _deviceService = deviceService;
    private readonly ISmsSender _smsSender = smsSender;
    private readonly IConfiguration _configuration = configuration;

    public async Task<ApiResponse<AuthenticationResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var authResult = await _identityService.AuthenticateAsync(request.Email, request.Password);
        var result = authResult.Item1;
        var user = authResult.Item2;

        // Get the user attempting to login (even if authentication failed)
        var attemptingUser = user ?? await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        // Create notification only for the user involved in the login attempt
        if (!result.Succeeded)
        {
            // Only notify the user who attempted to login (if user exists)
            if (attemptingUser != null)
            {
                var failedLoginNotification = new YaqeenPay.Domain.Entities.Notification
                {
                    UserId = attemptingUser.Id,
                    Type = YaqeenPay.Domain.Enums.NotificationType.Security,
                    Title = "Failed login attempt",
                    Message = $"Failed login attempt detected on your account from IP: {_currentUserService.IpAddress ?? "Unknown"}",
                    Priority = YaqeenPay.Domain.Enums.NotificationPriority.High,
                    Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty,
                    IsActive = true
                };

                _context.Notifications.Add(failedLoginNotification);
                await _context.SaveChangesAsync(cancellationToken);
            }

            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }

        // Generate JWT token with roles
        var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
        if (user == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }

        // Check if device verification is enabled (disabled in development by default)
        var deviceVerificationEnabled = _configuration["DeviceVerification:Enabled"] != "false";
        
        // Check for device recognition
        var userAgent = _currentUserService.UserAgent ?? "Unknown";
        var deviceFingerprint = _deviceService.GenerateDeviceFingerprint(userAgent);
        var existingDevice = await _deviceService.GetUserDeviceAsync(user.Id, deviceFingerprint, cancellationToken);

        // If this is a new device and device verification is enabled, require OTP verification
        if (existingDevice == null && deviceVerificationEnabled)
        {
            // Register the new device
            var newDevice = await _deviceService.RegisterDeviceAsync(user.Id, userAgent, ipAddress, cancellationToken);

            // Send OTP to user's phone
            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                // Generate OTP and store it temporarily
                var otp = GenerateOtp();
                var otpExpiry = DateTime.UtcNow.AddMinutes(10);
                
                // Store OTP in cache or temp storage (using notification for now)
                var otpNotification = new YaqeenPay.Domain.Entities.Notification
                {
                    UserId = user.Id,
                    Type = YaqeenPay.Domain.Enums.NotificationType.Security,
                    Title = "Device Verification Required",
                    Message = $"Your verification code is: {otp}. This code will expire in 10 minutes. Device: {newDevice.Browser} on {newDevice.OperatingSystem}",
                    Priority = YaqeenPay.Domain.Enums.NotificationPriority.High,
                    Status = YaqeenPay.Domain.Enums.NotificationStatus.Unread,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty,
                    IsActive = true,
                    Metadata = $"{{\"otp\":\"{otp}\",\"deviceId\":\"{newDevice.Id}\",\"expiry\":\"{otpExpiry:O}\",\"attempts\":0,\"lastSentAt\":\"{DateTime.UtcNow:O}\"}}"
                };

                _context.Notifications.Add(otpNotification);
                await _context.SaveChangesAsync(cancellationToken);

                // Send SMS with OTP
                try
                {
                    await _smsSender.SendOtpAsync(user.PhoneNumber, otp, cancellationToken: cancellationToken);
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the request
                    // User can still see OTP in notification for testing/fallback
                    Console.WriteLine($"Failed to send SMS: {ex.Message}");
                }
            }

            // Return response indicating OTP is required
            return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
            {
                Token = string.Empty,
                RefreshToken = string.Empty,
                TokenExpires = DateTime.UtcNow,
                UserId = user.Id,
                Email = user.Email!,
                UserName = user.UserName!,
                RequiresDeviceVerification = true,
                PendingDeviceId = newDevice.Id,
                IsNewUser = false
            }, "New device detected. Please verify with OTP sent to your phone.");
        }

        // Device is recognized or verification is disabled, proceed with login
        var roles = await _identityService.GetUserRolesAsync(user.Id);
        var (jwtToken, refreshToken) = _jwtService.GenerateTokens(user, roles, ipAddress);

        // Update device last seen if device exists
        if (existingDevice != null)
        {
            await _deviceService.UpdateDeviceLastSeenAsync(existingDevice.Id, cancellationToken);
        }
        else if (!deviceVerificationEnabled)
        {
            // If device verification is disabled, register the device automatically
            await _deviceService.RegisterDeviceAsync(user.Id, userAgent, ipAddress, cancellationToken);
        }

        // Only send notification for new devices (already handled above)
        // For existing devices, no notification needed

        // Save the refresh token
        user.RefreshTokens.Add(refreshToken);
        // Remove old refresh tokens
        RemoveOldRefreshTokens(user);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AuthenticationResponse>.SuccessResponse(new AuthenticationResponse
        {
            Token = jwtToken,
            // Return the raw refresh token to the client; we store only the hash server-side
            RefreshToken = refreshToken.Token,
            TokenExpires = refreshToken.ExpiresAt,
            UserId = user.Id,
            Email = user.Email!,
            UserName = user.UserName!,
            RequiresDeviceVerification = false,
            IsNewUser = false
        });
    }

    private string GenerateOtp()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }

    private void RemoveOldRefreshTokens(ApplicationUser user)
    {
        // Remove old inactive refresh tokens from user based on TTL
        user.RefreshTokens.RemoveAll(x => 
            !x.IsActive && 
            DateTime.UtcNow.AddDays(-7) >= x.ExpiresAt);
    }
}
