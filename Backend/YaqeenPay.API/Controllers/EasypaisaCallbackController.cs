using System.IO;
using System.Text;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using YaqeenPay.Application.Features.Payments.Commands;
using YaqeenPay.Infrastructure.Services.Easypaisa;

namespace YaqeenPay.API.Controllers
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

        [HttpPost("callback")]
        public async Task<IActionResult> Callback()
        {
            using var reader = new StreamReader(Request.Body, Encoding.UTF8);
            var body = await reader.ReadToEndAsync();
            var signature = Request.Headers["X-Easypaisa-Signature"].ToString();
            _logger.LogInformation("Received Easypaisa callback: {body}", body);
            _logger.LogInformation("Signature: {signature}", signature);
            if (!_easypaisaService.VerifySignature(body, signature))
            {
                _logger.LogWarning("Invalid Easypaisa signature");
                return Unauthorized();
            }
            // Parse transactionId from body (assume JSON with TransactionId)
            var transactionId = ""; // TODO: parse from body
            var command = new ConfirmPaymentCommand { TransactionId = transactionId, Signature = signature };
            var result = await _mediator.Send(command);
            if (result)
                return Ok();
            return BadRequest();
        }
    }
}
