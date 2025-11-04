using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiagnosticsController : ControllerBase
{
    private readonly EmailSettings _emailSettings;

    public DiagnosticsController(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    [HttpGet("email-config")]
    public IActionResult GetEmailConfig()
    {
        return Ok(new
        {
            SmtpServer = _emailSettings.SmtpServer,
            SmtpPort = _emailSettings.SmtpPort,
            SmtpUsername = _emailSettings.SmtpUsername,
            SmtpPasswordConfigured = !string.IsNullOrEmpty(_emailSettings.SmtpPassword),
            SmtpPasswordLength = _emailSettings.SmtpPassword?.Length ?? 0,
            SenderEmail = _emailSettings.SenderEmail,
            SenderName = _emailSettings.SenderName,
            EnableSsl = _emailSettings.EnableSsl
        });
    }
}
