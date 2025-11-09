using FluentValidation;
using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace TechTorio.Application.Features.Authentication.Commands.Login;

public record LoginCommand : IRequest<ApiResponse<AuthenticationResponse>>
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? CaptchaToken { get; set; } // CAPTCHA token for bot protection
    public string? DeviceLocation { get; set; } // Optional location for device verification
    public double? Latitude { get; set; } // Optional coordinates
    public double? Longitude { get; set; } // Optional coordinates
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
    // Indicates that this login came from a device not seen before for this user
    public bool IsNewDevice { get; set; }
}

public class LoginCommandHandler(
    IApplicationDbContext context,
    IIdentityService identityService,
    IJwtService jwtService,
    ICurrentUserService currentUserService,
    IDeviceService deviceService,
    ISmsSender smsSender,
    ISmsRateLimitService smsRateLimitService,
    IApiRateLimitService apiRateLimitService,
    ICaptchaService captchaService,
    IConfiguration configuration) : IRequestHandler<LoginCommand, ApiResponse<AuthenticationResponse>>
{
    private readonly IApplicationDbContext _context = context;
    private readonly IIdentityService _identityService = identityService;
    private readonly IJwtService _jwtService = jwtService;
    private readonly ICurrentUserService _currentUserService = currentUserService;
    private readonly IDeviceService _deviceService = deviceService;
    private readonly ISmsSender _smsSender = smsSender;
    private readonly ISmsRateLimitService _smsRateLimitService = smsRateLimitService;
    private readonly IApiRateLimitService _apiRateLimitService = apiRateLimitService;
    private readonly ICaptchaService _captchaService = captchaService;
    private readonly IConfiguration _configuration = configuration;

    public async Task<ApiResponse<AuthenticationResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var ipAddress = _currentUserService.IpAddress ?? "127.0.0.1";
        
        // 1. API RATE LIMITING - Block excessive login attempts (5 attempts per 15 minutes)
        var isAllowed = await _apiRateLimitService.IsAllowedAsync(ipAddress, "/api/auth/login", 5, 15);
        if (!isAllowed)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse(
                "Too many login attempts. Please try again in 15 minutes.");
        }
        
        // Record the attempt
        await _apiRateLimitService.RecordRequestAsync(ipAddress, "/api/auth/login");
        
        // 2. CAPTCHA VALIDATION - Prevent automated attacks
        var captchaEnabled = _configuration["Captcha:Enabled"] != "false";
        if (captchaEnabled)
        {
            if (string.IsNullOrEmpty(request.CaptchaToken))
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse(
                    "CAPTCHA verification required.");
            }
            
            var isCaptchaValid = await _captchaService.ValidateCaptchaAsync(request.CaptchaToken, ipAddress);
            if (!isCaptchaValid)
            {
                return ApiResponse<AuthenticationResponse>.FailureResponse(
                    "CAPTCHA verification failed. Please try again.");
            }
        }
        
        // 3. AUTHENTICATE USER
        var authResult = await _identityService.AuthenticateAsync(request.Email, request.Password);
        var result = authResult.Item1;
        var user = authResult.Item2;

        // SECURITY: Don't reveal if email exists or password is wrong - generic error message
        if (!result.Succeeded)
        {
            // Log failed attempt for security monitoring (don't save to notifications)
            // This prevents email enumeration attacks
            return ApiResponse<AuthenticationResponse>.FailureResponse("Invalid email or password.");
        }

        // 4. CHECK EMAIL VERIFICATION - User must verify email before login
        if (user == null)
        {
            return ApiResponse<AuthenticationResponse>.FailureResponse("Authentication failed");
        }

        if (!user.EmailConfirmed)
        {
            // Return error with userId in Data field so frontend can resend verification email
            return new ApiResponse<AuthenticationResponse>
            {
                Success = false,
                Message = "Please verify your email address before logging in. Check your inbox for the verification code.",
                Data = new AuthenticationResponse
                {
                    UserId = user.Id,
                    Email = user.Email ?? string.Empty
                }
            };
        }

        // 5. DEVICE VERIFICATION AND OTP (after successful authentication)

        // Check if device verification is enabled (disabled in development by default)
        var deviceVerificationEnabled = _configuration["DeviceVerification:Enabled"] != "false";
        var notifyOnNewDevice = _configuration["DeviceVerification:NotifyOnNewDevice"] != "false";
        
    // Check for device recognition
    var userAgent = _currentUserService.UserAgent ?? "Unknown";
    var deviceFingerprint = _deviceService.GenerateDeviceFingerprint(userAgent);
    var existingDevice = await _deviceService.GetUserDeviceAsync(user.Id, deviceFingerprint, cancellationToken);
    var isNewDevice = existingDevice == null;

        // If this is a new device and device verification is enabled, require OTP verification
        if (existingDevice == null && deviceVerificationEnabled)
        {
            // Register the new device
            var newDevice = await _deviceService.RegisterDeviceAsync(user.Id, userAgent, ipAddress, cancellationToken);

            // Send OTP to user's phone
            if (!string.IsNullOrEmpty(user.PhoneNumber))
            {
                // Check SMS rate limit before sending
                var deviceIdentifier = ipAddress; // Use IP address as device identifier
                var smsAllowed = await _smsRateLimitService.IsAllowedAsync(deviceIdentifier, user.PhoneNumber);
                
                if (!smsAllowed)
                {
                    var blockDuration = await _smsRateLimitService.GetBlockDurationAsync(deviceIdentifier);
                    var hoursRemaining = blockDuration.HasValue ? (int)Math.Ceiling(blockDuration.Value.TotalHours) : 24;
                    
                    return ApiResponse<AuthenticationResponse>.FailureResponse(
                        $"Too many SMS requests. Your device has been temporarily blocked. Please try again after {hoursRemaining} hour(s).");
                }
                
                // Generate OTP and store it temporarily
                var otp = GenerateOtp();
                var otpExpiry = DateTime.UtcNow.AddMinutes(10);
                
                // Store OTP in cache or temp storage (using notification for now)
                var locationInfo = !string.IsNullOrEmpty(request.DeviceLocation) 
                    ? $" from {request.DeviceLocation}" 
                    : "";
                
                var otpNotification = new TechTorio.Domain.Entities.Notification
                {
                    UserId = user.Id,
                    Type = TechTorio.Domain.Enums.NotificationType.Security,
                    Title = "New Device Login Detected",
                    Message = $"A new device login was detected{locationInfo}. Your verification code is: {otp}. This code will expire in 10 minutes. Device: {newDevice.Browser} on {newDevice.OperatingSystem}",
                    Priority = TechTorio.Domain.Enums.NotificationPriority.High,
                    Status = TechTorio.Domain.Enums.NotificationStatus.Unread,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty,
                    IsActive = true,
                    Metadata = $"{{\"otp\":\"{otp}\",\"deviceId\":\"{newDevice.Id}\",\"expiry\":\"{otpExpiry:O}\",\"attempts\":0,\"lastSentAt\":\"{DateTime.UtcNow:O}\",\"location\":\"{request.DeviceLocation ?? "Unknown"}\",\"latitude\":{request.Latitude?.ToString() ?? "null"},\"longitude\":{request.Longitude?.ToString() ?? "null"}}}"
                };

                _context.Notifications.Add(otpNotification);
                await _context.SaveChangesAsync(cancellationToken);

                // Send SMS with OTP
                try
                {
                    await _smsSender.SendOtpAsync(user.PhoneNumber, otp, cancellationToken: cancellationToken);
                    
                    // Record SMS attempt after successful send
                    await _smsRateLimitService.RecordAttemptAsync(deviceIdentifier, user.PhoneNumber);
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
                IsNewUser = false,
                IsNewDevice = true
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
            var newDevice = await _deviceService.RegisterDeviceAsync(user.Id, userAgent, ipAddress, cancellationToken);
            
            // Send notification for new device login even if verification is disabled
            if (notifyOnNewDevice)
            {
                var locationInfo = !string.IsNullOrEmpty(request.DeviceLocation) 
                    ? $" from {request.DeviceLocation}" 
                    : "";
                    
                var newDeviceNotification = new TechTorio.Domain.Entities.Notification
                {
                    UserId = user.Id,
                    Type = TechTorio.Domain.Enums.NotificationType.Security,
                    Title = "New Device Login",
                    Message = $"Your account was accessed from a new device{locationInfo}. If this wasn't you, please secure your account immediately. Device: {newDevice.Browser} on {newDevice.OperatingSystem}",
                    Priority = TechTorio.Domain.Enums.NotificationPriority.Medium,
                    Status = TechTorio.Domain.Enums.NotificationStatus.Unread,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = Guid.Empty,
                    IsActive = true,
                    Metadata = $"{{\"deviceId\":\"{newDevice.Id}\",\"location\":\"{request.DeviceLocation ?? "Unknown"}\",\"latitude\":{request.Latitude?.ToString() ?? "null"},\"longitude\":{request.Longitude?.ToString() ?? "null"},\"ipAddress\":\"{ipAddress}\"}}"
                };

                _context.Notifications.Add(newDeviceNotification);
                await _context.SaveChangesAsync(cancellationToken);
            }
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
            IsNewUser = false,
            IsNewDevice = isNewDevice
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
