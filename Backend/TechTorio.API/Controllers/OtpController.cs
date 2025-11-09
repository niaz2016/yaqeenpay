using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Domain.Entities.Identity;

namespace TechTorio.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OtpController : ControllerBase
    {
        private readonly IOtpService _otpService;
        private readonly Application.Common.Interfaces.IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ILogger<OtpController> _logger;

        public OtpController(
            IOtpService otpService,
            Application.Common.Interfaces.IEmailService emailService,
            UserManager<ApplicationUser> userManager,
            ILogger<OtpController> logger)
        {
            _otpService = otpService;
            _emailService = emailService;
            _userManager = userManager;
            _logger = logger;
        }

        public class SendOtpRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Purpose { get; set; } = "registration"; // optional purpose
        }

        public class VerifyOtpRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Otp { get; set; } = string.Empty;
            public string Purpose { get; set; } = "registration";
        }

        [HttpPost("send")]
        [AllowAnonymous]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { error = "Email is required" });

            var key = $"email:{request.Purpose}:{request.Email.ToLowerInvariant()}";

            // rate limit: max 5 sends per 300 seconds
            var rateLimited = await _otpService.IsRateLimitedAsync(key, maxAttempts: 5, windowSeconds: 300);
            if (rateLimited)
            {
                return StatusCode(429, new { error = "Too many OTP requests. Try again later." });
            }

            var otp = await _otpService.GenerateOtpAsync(key, length: 6, expirySeconds: 300);

            // Simple email template
            var subject = "Your verification code";
            var html = $"<p>Your verification code is <strong>{otp}</strong>. It will expire in 5 minutes.</p>";
            var text = $"Your verification code is {otp}. It will expire in 5 minutes.";

            try
            {
                await _emailService.SendEmailAsync(request.Email, subject, html, text);
                _logger.LogInformation("Sent OTP to {Email} (purpose={Purpose})", request.Email, request.Purpose);
                return Ok(new { success = true });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {Email}", request.Email);
                return StatusCode(500, new { error = "Failed to send email" });
            }
        }

        [HttpPost("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(new { error = "Email and OTP are required" });

            var key = $"email:{request.Purpose}:{request.Email.ToLowerInvariant()}";

            var valid = await _otpService.ValidateOtpAsync(key, request.Otp);
            if (!valid)
            {
                return BadRequest(new { success = false, error = "Invalid or expired OTP" });
            }

            // If a user exists, mark their email as confirmed
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null && !user.EmailConfirmed)
            {
                user.EmailConfirmed = true;
                await _userManager.UpdateAsync(user);
            }

            // Invalidate OTP (best-effort)
            await _otpService.InvalidateOtpAsync(key);

            return Ok(new { success = true });
        }
    }
}
