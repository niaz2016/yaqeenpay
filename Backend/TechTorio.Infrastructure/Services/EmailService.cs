using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;

namespace TechTorio.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, string? plainTextBody = null)
    {
        try
        {
            using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort)
            {
                EnableSsl = _emailSettings.EnableSsl,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword),
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            // Add plain text alternative if provided
            if (!string.IsNullOrEmpty(plainTextBody))
            {
                var plainView = AlternateView.CreateAlternateViewFromString(plainTextBody, null, "text/plain");
                var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html");
                mailMessage.AlternateViews.Add(plainView);
                mailMessage.AlternateViews.Add(htmlView);
            }

            await client.SendMailAsync(mailMessage);
            
            _logger.LogInformation("Email sent successfully to {Email} with subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} with subject: {Subject}", toEmail, subject);
            throw new InvalidOperationException($"Failed to send email: {ex.Message}", ex);
        }
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink, string userName)
    {
        var subject = "Reset Your TechTorio Password";
        
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>TechTorio</h1>
        </div>
        <div class='content'>
            <h2>Password Reset Request</h2>
            <p>Hello {userName},</p>
            <p>We received a request to reset your password for your TechTorio account.</p>
            <p>Click the button below to reset your password:</p>
            <p style='text-align: center;'>
                <a href='{resetLink}' class='button'>Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style='word-break: break-all; color: #4CAF50;'>{resetLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The TechTorio Team</p>
        </div>
        <div class='footer'>
            <p>© 2025 TechTorio | Techtorio.online</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>";

        var plainTextBody = $@"
TechTorio - Password Reset Request

Hello {userName},

We received a request to reset your password for your TechTorio account.

Click the link below to reset your password:
{resetLink}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

Best regards,
The TechTorio Team

© 2025 TechTorio | Techtorio.online
This is an automated email. Please do not reply.
";

        await SendEmailAsync(toEmail, subject, htmlBody, plainTextBody);
    }

    public async Task SendEmailVerificationAsync(string toEmail, string verificationLink, string userName)
    {
        var subject = "Verify Your TechTorio Email Address";
        
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to TechTorio!</h1>
        </div>
        <div class='content'>
            <h2>Verify Your Email Address</h2>
            <p>Hello {userName},</p>
            <p>Thank you for registering with TechTorio!</p>
            <p>Please click the button below to verify your email address:</p>
            <p style='text-align: center;'>
                <a href='{verificationLink}' class='button'>Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style='word-break: break-all; color: #2196F3;'>{verificationLink}</p>
            <p><strong>This link will expire in 48 hours.</strong></p>
            <p>Best regards,<br>The TechTorio Team</p>
        </div>
        <div class='footer'>
            <p>© 2025 TechTorio | Techtorio.online</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>";

        var plainTextBody = $@"
Welcome to TechTorio!

Hello {userName},

Thank you for registering with TechTorio!

Please verify your email address by clicking the link below:
{verificationLink}

This link will expire in 48 hours.

Best regards,
The TechTorio Team

© 2025 TechTorio | Techtorio.online
";

        await SendEmailAsync(toEmail, subject, htmlBody, plainTextBody);
    }

    public async Task SendWelcomeEmailAsync(string toEmail, string userName)
    {
        var subject = "Welcome to TechTorio!";
        
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
        .feature {{ margin: 15px 0; padding: 15px; background-color: white; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🎉 Welcome to TechTorio!</h1>
        </div>
        <div class='content'>
            <h2>Hello {userName},</h2>
            <p>Your account has been successfully created!</p>
            <p>TechTorio is your trusted marketplace platform for secure transactions.</p>
            
            <div class='feature'>
                <h3>✓ Secure Wallet</h3>
                <p>Manage your funds with our secure wallet system</p>
            </div>
            
            <div class='feature'>
                <h3>✓ Marketplace</h3>
                <p>Buy and sell products with confidence</p>
            </div>
            
            <div class='feature'>
                <h3>✓ Easy Payments</h3>
                <p>Multiple payment methods supported</p>
            </div>
            
            <p>Get started by exploring our marketplace!</p>
            <p>Best regards,<br>The TechTorio Team</p>
        </div>
        <div class='footer'>
            <p>© 2025 TechTorio | Techtorio.online</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendOrderConfirmationEmailAsync(string toEmail, string userName, string orderId, decimal amount)
    {
        var subject = $"Order Confirmation - #{orderId}";
        
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #FF9800; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
        .order-box {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Order Confirmed!</h1>
        </div>
        <div class='content'>
            <h2>Hello {userName},</h2>
            <p>Thank you for your order!</p>
            
            <div class='order-box'>
                <h3>Order Details</h3>
                <p><strong>Order ID:</strong> #{orderId}</p>
                <p><strong>Amount:</strong> PKR {amount:N2}</p>
                <p><strong>Status:</strong> Processing</p>
            </div>
            
            <p>We'll notify you when your order is ready for delivery.</p>
            <p>You can track your order status in your TechTorio dashboard.</p>
            
            <p>Best regards,<br>The TechTorio Team</p>
        </div>
        <div class='footer'>
            <p>© 2025 TechTorio | Techtorio.online</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendPaymentReceivedEmailAsync(string toEmail, string userName, decimal amount, string transactionId)
    {
        var subject = "Payment Received - TechTorio";
        
        var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
        .amount {{ font-size: 32px; color: #4CAF50; text-align: center; margin: 20px 0; font-weight: bold; }}
        .transaction-box {{ background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 30px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>✓ Payment Received</h1>
        </div>
        <div class='content'>
            <h2>Hello {userName},</h2>
            <p>We've successfully received your payment.</p>
            
            <div class='amount'>PKR {amount:N2}</div>
            
            <div class='transaction-box'>
                <h3>Transaction Details</h3>
                <p><strong>Transaction ID:</strong> {transactionId}</p>
                <p><strong>Amount:</strong> PKR {amount:N2}</p>
                <p><strong>Status:</strong> Completed</p>
                <p><strong>Date:</strong> {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC</p>
            </div>
            
            <p>Your wallet has been credited and the funds are now available.</p>
            
            <p>Best regards,<br>The TechTorio Team</p>
        </div>
        <div class='footer'>
            <p>© 2025 TechTorio | Techtorio.online</p>
        </div>
    </div>
</body>
</html>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }
}
