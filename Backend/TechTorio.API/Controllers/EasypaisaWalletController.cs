using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using TechTorio.Application.Features.Payments.Commands;

namespace TechTorio.API.Controllers
{
    [ApiController]
    [Route("api/wallet")]
    public class EasypaisaWalletController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EasypaisaWalletController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("topup")]
        public async Task<IActionResult> TopUp([FromBody] TopUpWalletCommand command)
        {
            var paymentUrl = await _mediator.Send(command);
            return Ok(new { PaymentUrl = paymentUrl });
        }
    }
}
