using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TechTorio.Application.Features.Payments.Commands;
using TechTorio.Infrastructure.Services.Easypaisa;

namespace TechTorio.API.Controllers
{
    [ApiController]
    [Route("api/payment")] 
    public class EasypaisaCallbackController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly EasypaisaPaymentService _easypaisaService;
        private readonly ILogger<EasypaisaCallbackController> _logger;

        public EasypaisaCallbackController(IMediator mediator, EasypaisaPaymentService easypaisaService, ILogger<EasypaisaCallbackController> logger)
        {
            _mediator = mediator;
            _easypaisaService = easypaisaService;
            _logger = logger;
        }

        private class CallbackDto
        {
            public string? TransactionId { get; set; }
            public string? Status { get; set; }
            public string? OrderId { get; set; }
            public string? Amount { get; set; }
        }

        [HttpPost("callback")]
        public async Task<IActionResult> Callback()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var signature = Request.Headers["X-Easypaisa-Signature"].ToString();
            _logger.LogInformation("Received Easypaisa callback: {body}", body);

            if (!_easypaisaService.VerifySignature(body, signature))
            {
                _logger.LogWarning("Invalid Easypaisa signature");
                return Unauthorized(new { success = false, message = "Invalid signature" });
            }

            CallbackDto? parsed = null;
            try
            {
                parsed = JsonSerializer.Deserialize<CallbackDto>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to parse Easypaisa callback body");
                return BadRequest(new { success = false, message = "Invalid callback payload" });
            }

            var transactionId = parsed?.TransactionId;
            if (string.IsNullOrWhiteSpace(transactionId))
            {
                _logger.LogWarning("Easypaisa callback missing TransactionId");
                return BadRequest(new { success = false, message = "Missing TransactionId" });
            }

            var command = new ConfirmPaymentCommand { TransactionId = transactionId, Signature = signature };
            var result = await _mediator.Send(command);
            if (result)
                return Ok(new { success = true });
            return BadRequest(new { success = false, message = "Confirmation failed" });
        }
    }
}
