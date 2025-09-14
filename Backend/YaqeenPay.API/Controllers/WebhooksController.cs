using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.Wallets.Commands.ConfirmTopUp;

namespace YaqeenPay.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebhooksController : ApiControllerBase
    {
        private readonly ILogger<WebhooksController> _logger;

        public WebhooksController(ILogger<WebhooksController> logger)
        {
            _logger = logger;
        }
        
        [HttpPost("jazzcash")]
        public async Task<IActionResult> JazzCashCallback([FromBody] JazzCashCallbackRequest request)
        {
            _logger.LogInformation("Received JazzCash callback: {Reference}", request.Reference);
            
            if (request.Status == "success" && Guid.TryParse(request.MerchantReference, out Guid topUpId))
            {
                try
                {
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
                    _logger.LogError(ex, "Error processing JazzCash callback for top-up {TopUpId}", topUpId);
                    return StatusCode(500, new { success = false, message = "Error processing callback" });
                }
            }
            
            return BadRequest(new { success = false, message = "Invalid callback data" });
        }
        
        [HttpPost("easypaisa")]
        public async Task<IActionResult> EasypaisaCallback([FromBody] EasypaisaCallbackRequest request)
        {
            _logger.LogInformation("Received Easypaisa callback: {Reference}", request.TxnReference);
            
            if (request.ResultCode == "0000" && Guid.TryParse(request.OrderId, out Guid topUpId))
            {
                try
                {
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
                    _logger.LogError(ex, "Error processing Easypaisa callback for top-up {TopUpId}", topUpId);
                    return StatusCode(500, new { success = false, message = "Error processing callback" });
                }
            }
            
            return BadRequest(new { success = false, message = "Invalid callback data" });
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