using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailService _emailService;
    private readonly ILogger<EmailTestController> _logger;

    public EmailTestController(
        IEmailService emailService,
        ILogger<EmailTestController> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Send a test email (for development/testing only)
    /// </summary>
    [HttpPost("send-test")]
    [AllowAnonymous] // Remove this in production!
    public async Task<IActionResult> SendTestEmail([FromBody] TestEmailRequest request)
    {
        try
        {
            await _emailService.SendEmailAsync(
                request.ToEmail,
                request.Subject ?? "Test Email from TechTorio",
                request.HtmlBody ?? "<h1>Test Email</h1><p>This is a test email from TechTorio mail system.</p>",
                request.PlainTextBody ?? "Test Email - This is a test email from TechTorio mail system.");

            return Ok(ApiResponse<object>.SuccessResponse(
                new { message = "Test email sent successfully!", toEmail = request.ToEmail },
                "Email sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test email to {Email}", request.ToEmail);
            return BadRequest(ApiResponse<object>.FailureResponse($"Failed to send email: {ex.Message}"));
        }
    }

    /// <summary>
    /// Send a password reset email (test)
    /// </summary>
    [HttpPost("send-password-reset")]
    [AllowAnonymous]
    public async Task<IActionResult> SendPasswordReset([FromBody] PasswordResetEmailRequest request)
    {
        try
        {
            await _emailService.SendPasswordResetEmailAsync(
                request.ToEmail,
                request.ResetLink ?? "https://techtorio.online/techtorio/reset-password?token=test123",
                request.UserName ?? "Test User");

            return Ok(ApiResponse<object>.SuccessResponse(
                new { message = "Password reset email sent!", toEmail = request.ToEmail },
                "Email sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", request.ToEmail);
            return BadRequest(ApiResponse<object>.FailureResponse($"Failed to send email: {ex.Message}"));
        }
    }

    /// <summary>
    /// Send a welcome email (test)
    /// </summary>
    [HttpPost("send-welcome")]
    [AllowAnonymous]
    public async Task<IActionResult> SendWelcome([FromBody] WelcomeEmailRequest request)
    {
        try
        {
            await _emailService.SendWelcomeEmailAsync(
                request.ToEmail,
                request.UserName ?? "New User");

            return Ok(ApiResponse<object>.SuccessResponse(
                new { message = "Welcome email sent!", toEmail = request.ToEmail },
                "Email sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send welcome email to {Email}", request.ToEmail);
            return BadRequest(ApiResponse<object>.FailureResponse($"Failed to send email: {ex.Message}"));
        }
    }

    /// <summary>
    /// Send a payment received email (test)
    /// </summary>
    [HttpPost("send-payment-received")]
    [AllowAnonymous]
    public async Task<IActionResult> SendPaymentReceived([FromBody] PaymentReceivedEmailRequest request)
    {
        try
        {
            await _emailService.SendPaymentReceivedEmailAsync(
                request.ToEmail,
                request.UserName ?? "Test User",
                request.Amount,
                request.TransactionId ?? Guid.NewGuid().ToString());

            return Ok(ApiResponse<object>.SuccessResponse(
                new { message = "Payment received email sent!", toEmail = request.ToEmail },
                "Email sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send payment received email to {Email}", request.ToEmail);
            return BadRequest(ApiResponse<object>.FailureResponse($"Failed to send email: {ex.Message}"));
        }
    }
}

public record TestEmailRequest(
    string ToEmail,
    string? Subject = null,
    string? HtmlBody = null,
    string? PlainTextBody = null);

public record PasswordResetEmailRequest(
    string ToEmail,
    string? UserName = null,
    string? ResetLink = null);

public record WelcomeEmailRequest(
    string ToEmail,
    string? UserName = null);

public record PaymentReceivedEmailRequest(
    string ToEmail,
    decimal Amount,
    string? UserName = null,
    string? TransactionId = null);
