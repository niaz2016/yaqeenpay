using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.UserManagement.Commands.UpdateProfile;
using YaqeenPay.Application.Features.UserManagement.Queries.GetUserProfile;
using YaqeenPay.Application.Common.Interfaces;
using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Entities.Identity;

namespace YaqeenPay.API.Controllers;

[
Authorize]
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

    // Request phone verification OTP
    [HttpPost("verify-phone/request")]
    public async Task<IActionResult> RequestPhoneVerification()
    {
        var userId = _currentUser.UserId;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(user.PhoneNumber))
            return BadRequest(new { success = false, message = "No phone number on file" });

        var key = $"phone:{user.PhoneNumber}";
        var isLimited = await _otpService.IsRateLimitedAsync(key, maxAttempts: 5, windowSeconds: 3600);
        if (isLimited)
            return BadRequest(new { success = false, message = "Too many attempts. Try again later." });

        var otp = await _otpService.GenerateOtpAsync(key, length: 6, expirySeconds: 300);
        // Enqueue SMS via outbox (provider integration to be added later)
        await _outboxService.EnqueueAsync(
            type: "sms",
            payload: new { to = user.PhoneNumber, template = "PHONE_VERIFY", code = otp });

        // Mask phone for response
        string masked = user.PhoneNumber.Length >= 4
            ? new string('*', Math.Max(0, user.PhoneNumber.Length - 4)) + user.PhoneNumber[^4..]
            : user.PhoneNumber;
        return Ok(new { success = true, data = new { phone = masked, expiresInSeconds = 300 } });
    }

    public record VerifyPhoneDto(string Otp);

    // Confirm phone verification OTP
    [HttpPost("verify-phone/confirm")]
    public async Task<IActionResult> ConfirmPhoneVerification([FromBody] VerifyPhoneDto dto)
    {
        if (dto is null || string.IsNullOrWhiteSpace(dto.Otp))
            return BadRequest(new { success = false, message = "OTP is required" });

        var userId = _currentUser.UserId;
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return Unauthorized();
        if (string.IsNullOrWhiteSpace(user.PhoneNumber))
            return BadRequest(new { success = false, message = "No phone number on file" });

        var key = $"phone:{user.PhoneNumber}";
        var valid = await _otpService.ValidateOtpAsync(key, dto.Otp);
        if (!valid)
            return BadRequest(new { success = false, message = "Invalid or expired OTP" });

        user.PhoneNumberConfirmed = true;
        user.PhoneVerifiedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        return Ok(new { success = true, message = "Phone verified" });
    }
}