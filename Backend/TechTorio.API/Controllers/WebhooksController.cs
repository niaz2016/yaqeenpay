using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Features.Wallets.Commands.ConfirmTopUp;
using System.Globalization;

namespace TechTorio.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : ApiControllerBase
    {
        private readonly ILogger<WebhooksController> _logger;
        private readonly IWalletService _walletService;
        private readonly TechTorio.Application.Features.Wallets.Services.IBankSmsProcessingService _smsProcessor;
        private readonly IConfiguration _config;

        public WebhooksController(ILogger<WebhooksController> logger, IWalletService walletService, TechTorio.Application.Features.Wallets.Services.IBankSmsProcessingService smsProcessor, IConfiguration config)
        {
            _logger = logger;
            _walletService = walletService;
            _smsProcessor = smsProcessor;
            _config = config;
        }

        private bool ValidateSharedSecret(Microsoft.AspNetCore.Http.IHeaderDictionary headers, out string? failureReason)
        {
            failureReason = null;
            var provided = headers["X-Webhook-Secret"].FirstOrDefault();
            var expected = _config["Webhooks:Secret"] ?? _config["BankSms:Secret"]; // fallback to BankSms secret if dedicated one missing

            if (!string.IsNullOrWhiteSpace(expected))
            {
                if (string.IsNullOrWhiteSpace(provided) || !string.Equals(provided.Trim(), expected.Trim(), StringComparison.Ordinal))
                {
                    failureReason = "Invalid webhook secret";
                    return false;
                }
            }
            else
            {
                // If no secret configured, allow but warn (development only recommendation)
                _logger.LogWarning("No Webhooks:Secret configured; webhook authentication is disabled. Configure a secret to secure callbacks.");
            }
            return true;
        }

        private static bool TryParseAmount(string? raw, out decimal amount)
        {
            amount = 0m;
            if (string.IsNullOrWhiteSpace(raw)) return false;
            // Remove currency symbols and spaces, keep digits, comma, dot
            var cleaned = new string(raw.Where(c => char.IsDigit(c) || c == '.' || c == ',').ToArray()).Replace(",", "");
            return decimal.TryParse(cleaned, NumberStyles.Number | NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out amount);
        }

        [HttpPost("jazzcash")]
        public async Task<IActionResult> JazzCashCallback([FromBody] JazzCashCallbackRequest request)
        {
            if (!ValidateSharedSecret(Request.Headers, out var reason))
            {
                _logger.LogWarning("Unauthorized JazzCash webhook: {Reason}", reason);
                return Unauthorized(new { success = false, message = reason });
            }

            if (request == null)
            {
                return BadRequest(new { success = false, message = "Missing payload" });
            }

            _logger.LogInformation("Received JazzCash callback: {Reference}", request.Reference);

            if (string.Equals(request.Status, "success", StringComparison.OrdinalIgnoreCase) && Guid.TryParse(request.MerchantReference, out Guid topUpId))
            {
                try
                {
                    var topUp = await _walletService.GetTopUpAsync(topUpId);
                    if (topUp == null)
                    {
                        return NotFound(new { success = false, message = "Top-up not found" });
                    }

                    // Channel safety: ensure top-up was initiated for JazzCash
                    if (topUp.Channel != Domain.Enums.TopUpChannel.JazzCash)
                    {
                        _logger.LogWarning("Top-up {TopUpId} channel mismatch. Expected {Expected}, actual {Actual}", topUpId, Domain.Enums.TopUpChannel.JazzCash, topUp.Channel);
                        return BadRequest(new { success = false, message = "Channel mismatch" });
                    }

                    // Idempotency: already confirmed
                    if (topUp.Status == Domain.Enums.TopUpStatus.Confirmed)
                    {
                        return Ok(new { success = true, message = "Already confirmed" });
                    }

                    // Check if top-up requires admin approval
                    if (topUp.Status == Domain.Enums.TopUpStatus.PendingAdminApproval)
                    {
                        _logger.LogInformation("Top-up {TopUpId} is pending admin approval, skipping auto-confirmation", topUpId);
                        return Ok(new { success = true, message = "Top-up marked as paid, pending admin approval" });
                    }

                    // Validate amount if present
                    if (TryParseAmount(request.Amount, out var callbackAmount))
                    {
                        if (callbackAmount != topUp.Amount.Amount)
                        {
                            _logger.LogWarning("Amount mismatch for top-up {TopUpId}: callback={CallbackAmount} expected={Expected}", topUpId, callbackAmount, topUp.Amount.Amount);
                            return BadRequest(new { success = false, message = "Amount mismatch" });
                        }
                    }

                    var command = new ConfirmTopUpCommand
                    {
                        TopUpId = topUpId,
                        ExternalReference = request.Reference
                    };

                    await Mediator.Send(command);
                    return Ok(new { success = true, message = "Top-up confirmed" });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing JazzCash callback for top-up {TopUpId}", request.MerchantReference);
                    return StatusCode(500, new { success = false, message = "Error processing callback" });
                }
            }

            return BadRequest(new { success = false, message = "Invalid callback data" });
        }

        [HttpPost("easypaisa")]
        public async Task<IActionResult> EasypaisaCallback([FromBody] EasypaisaCallbackRequest request)
        {
            if (!ValidateSharedSecret(Request.Headers, out var reason))
            {
                _logger.LogWarning("Unauthorized Easypaisa webhook: {Reason}", reason);
                return Unauthorized(new { success = false, message = reason });
            }

            if (request == null)
            {
                return BadRequest(new { success = false, message = "Missing payload" });
            }

            _logger.LogInformation("Received Easypaisa callback: {Reference}", request.TxnReference);

            if (string.Equals(request.ResultCode, "0000", StringComparison.OrdinalIgnoreCase) && Guid.TryParse(request.OrderId, out Guid topUpId))
            {
                try
                {
                    var topUp = await _walletService.GetTopUpAsync(topUpId);
                    if (topUp == null)
                    {
                        return NotFound(new { success = false, message = "Top-up not found" });
                    }

                    // Channel safety: ensure top-up was initiated for Easypaisa
                    if (topUp.Channel != Domain.Enums.TopUpChannel.Easypaisa)
                    {
                        _logger.LogWarning("Top-up {TopUpId} channel mismatch. Expected {Expected}, actual {Actual}", topUpId, Domain.Enums.TopUpChannel.Easypaisa, topUp.Channel);
                        return BadRequest(new { success = false, message = "Channel mismatch" });
                    }

                    // Idempotency: already confirmed
                    if (topUp.Status == Domain.Enums.TopUpStatus.Confirmed)
                    {
                        return Ok(new { success = true, message = "Already confirmed" });
                    }

                    // Check if top-up requires admin approval
                    if (topUp.Status == Domain.Enums.TopUpStatus.PendingAdminApproval)
                    {
                        _logger.LogInformation("Top-up {TopUpId} is pending admin approval, skipping auto-confirmation", topUpId);
                        return Ok(new { success = true, message = "Top-up marked as paid, pending admin approval" });
                    }

                    // Validate amount if present
                    if (TryParseAmount(request.Amount, out var callbackAmount))
                    {
                        if (callbackAmount != topUp.Amount.Amount)
                        {
                            _logger.LogWarning("Amount mismatch for top-up {TopUpId}: callback={CallbackAmount} expected={Expected}", topUpId, callbackAmount, topUp.Amount.Amount);
                            return BadRequest(new { success = false, message = "Amount mismatch" });
                        }
                    }

                    var command = new ConfirmTopUpCommand
                    {
                        TopUpId = topUpId,
                        ExternalReference = request.TxnReference
                    };

                    await Mediator.Send(command);
                    return Ok(new { success = true, message = "Top-up confirmed" });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing Easypaisa callback for top-up {TopUpId}", request.OrderId);
                    return StatusCode(500, new { success = false, message = "Error processing callback" });
                }
            }

            return BadRequest(new { success = false, message = "Invalid callback data" });
        }

        // New: MacroDroid -> Bank SMS webhook
        // Accepts: { "sms": "<full raw sms text>", "userId": "optional-guid" }
        // Header: X-Webhook-Secret: <shared secret>
        [HttpPost("bank-sms")]
        [Consumes("application/json", "text/plain")]
        public async Task<IActionResult> BankSms([FromBody] BankSmsRequest payload)
        {
            var secret = Request.Headers["X-Webhook-Secret"].FirstOrDefault();
            var sms = payload?.Sms ?? string.Empty;
            if (string.IsNullOrWhiteSpace(sms))
                return BadRequest(new { success = false, message = "Missing sms text" });

            var (ok, message) = await _smsProcessor.ProcessIncomingSmsAsync(sms, secret);
            if (ok) return Ok(new { success = true, message });
            return BadRequest(new { success = false, message });
        }
    }

    public class JazzCashCallbackRequest
    {
        public string Reference { get; set; } = string.Empty;
        public string MerchantReference { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
    }

    public class EasypaisaCallbackRequest
    {
        public string OrderId { get; set; } = string.Empty;
        public string TxnReference { get; set; } = string.Empty;
        public string ResultCode { get; set; } = string.Empty;
        public string Amount { get; set; } = string.Empty;
    }
}

public class BankSmsRequest
{
    public string Sms { get; set; } = string.Empty;
    //public Guid? UserId { get; set; }
}