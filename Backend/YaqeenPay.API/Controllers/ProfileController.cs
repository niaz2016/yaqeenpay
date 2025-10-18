using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.UserManagement.Commands.UpdateProfile;
using YaqeenPay.Application.Features.UserManagement.Queries.GetUserProfile;
using YaqeenPay.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class ProfileController : ApiControllerBase
{
    private readonly IOtpService _otpService;
    private readonly ICurrentUserService _currentUser;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IOutboxService _outboxService;

    public ProfileController(IOtpService otpService,
                             ICurrentUserService currentUser,
                             UserManager<ApplicationUser> userManager,
                             IOutboxService outboxService)
    {
        _otpService = otpService;
        _currentUser = currentUser;
        _userManager = userManager;
        _outboxService = outboxService;
    }
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] Application.Features.UserManagement.Commands.ChangePassword.ChangePasswordCommand command)
    {
        var result = await Mediator.Send(command);
        if (result)
            return Ok(new { success = true, message = "Password changed successfully" });
        return BadRequest(new { success = false, message = "Password change failed" });
    }
    [HttpGet]
    public async Task<IActionResult> GetUserProfile()
    {
        return Ok(await Mediator.Send(new GetUserProfileQuery()));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile(UpdateProfileCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadProfileImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { success = false, message = "No file provided" });

        // Ensure uploads folder exists under wwwroot
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsPath)) Directory.CreateDirectory(uploadsPath);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid().ToString()}_blob{ext}";
        var filePath = Path.Combine(uploadsPath, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
        // Return wrapped ApiResponse { success: true, data: { url } } so frontend ApiService unwraps correctly
        return Ok(new { success = true, data = new { url } });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail()
    {
        var userId = _currentUser.UserId;
        if (userId == Guid.Empty)
        {
            return Unauthorized(new { success = false, message = "User is not authenticated." });
        }

        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
        {
            return Unauthorized(new { success = false, message = "User account could not be found." });
        }

        if (string.IsNullOrWhiteSpace(user.Email))
        {
            return BadRequest(new { success = false, message = "No email address is associated with this account." });
        }

        var alreadyVerified = user.EmailConfirmed || user.EmailVerifiedAt.HasValue;
        if (!alreadyVerified)
        {
            user.EmailConfirmed = true;
            user.EmailVerifiedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        return Ok(new
        {
            success = true,
            message = alreadyVerified ? "Email is already verified." : "Email verified successfully.",
            verifiedAt = user.EmailVerifiedAt,
            data = (object?)null
        });
    }

    public record RequestPhoneVerificationDto(string? PhoneNumber);

    // Request phone verification OTP
    [HttpPost("verify-phone/request")]
    [AllowAnonymous]
    public async Task<IActionResult> RequestPhoneVerification([FromBody] RequestPhoneVerificationDto? dto)
    {
        ApplicationUser? user = null;
        string phoneNumber = string.Empty;

        // Check if user is authenticated
        if (User.Identity?.IsAuthenticated == true)
        {
            // Authenticated user - get phone from their profile
            var userId = _currentUser.UserId;
            user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return Unauthorized();
            if (string.IsNullOrWhiteSpace(user.PhoneNumber))
                return BadRequest(new { success = false, message = "No phone number on file" });
            phoneNumber = user.PhoneNumber;
        }
        else
        {
            // Unauthenticated request - phone number must be provided
            if (dto?.PhoneNumber == null || string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest(new { success = false, message = "Phone number is required for unauthenticated requests" });
            
            phoneNumber = dto.PhoneNumber.Trim();
            
            // Validate phone number format
            if (!IsValidPhoneNumber(phoneNumber))
                return BadRequest(new { success = false, message = "Invalid phone number format" });
            
            // Find user by phone number
            user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
            if (user == null)
                return BadRequest(new { success = false, message = "No user found with this phone number" });
        }

        var key = $"phone:{phoneNumber}";
        var isLimited = await _otpService.IsRateLimitedAsync(key, maxAttempts: 5, windowSeconds: 3600);
        if (isLimited)
            return BadRequest(new { success = false, message = "Too many attempts. Try again later." });

        var otp = await _otpService.GenerateOtpAsync(key, length: 6, expirySeconds: 300);
        // Enqueue SMS via outbox (provider integration to be added later)
        await _outboxService.EnqueueAsync(
            type: "sms",
            payload: new { to = phoneNumber, template = "PHONE_VERIFY", code = otp });

        // Mask phone for response
        string masked = phoneNumber.Length >= 4
            ? new string('*', Math.Max(0, phoneNumber.Length - 4)) + phoneNumber[^4..]
            : phoneNumber;
        return Ok(new { success = true, data = new { phone = masked, expiresInSeconds = 300 } });
    }

    public record VerifyPhoneDto(string Otp, string? PhoneNumber);

    // Confirm phone verification OTP
    [HttpPost("verify-phone/confirm")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmPhoneVerification([FromBody] VerifyPhoneDto dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Otp))
            return BadRequest(new { success = false, message = "OTP is required" });

        ApplicationUser? user = null;
        string phoneNumber = string.Empty;

        // Check if user is authenticated
        if (User.Identity?.IsAuthenticated == true)
        {
            // Authenticated user - get phone from their profile
            var userId = _currentUser.UserId;
            user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return Unauthorized();
            if (string.IsNullOrWhiteSpace(user.PhoneNumber))
                return BadRequest(new { success = false, message = "No phone number on file" });
            phoneNumber = user.PhoneNumber;
        }
        else
        {
            // Unauthenticated request - phone number must be provided
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest(new { success = false, message = "Phone number is required for unauthenticated requests" });
            
            phoneNumber = dto.PhoneNumber.Trim();
            
            // Validate phone number format
            if (!IsValidPhoneNumber(phoneNumber))
                return BadRequest(new { success = false, message = "Invalid phone number format" });
            
            // Find user by phone number
            user = await _userManager.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
            if (user == null)
                return BadRequest(new { success = false, message = "No user found with this phone number" });
        }

        var key = $"phone:{phoneNumber}";
        var valid = await _otpService.ValidateOtpAsync(key, dto.Otp);
        if (!valid)
            return BadRequest(new { success = false, message = "Invalid or expired OTP" });

        user.PhoneNumberConfirmed = true;
        user.PhoneVerifiedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        
        return Ok(new { 
            success = true, 
            message = "Phone verified",
            data = new { 
                userId = user.Id,
                phoneNumber = phoneNumber,
                verifiedAt = user.PhoneVerifiedAt
            }
        });
    }

    private static bool IsValidPhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;
            
        // Basic validation for phone numbers - adjust regex as needed for your requirements
        // This allows numbers with optional country code, 10-15 digits
        return System.Text.RegularExpressions.Regex.IsMatch(phoneNumber, @"^\+?\d{10,15}$");
    }
}