using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.Wallets.Commands.ConfirmTopUp;
using YaqeenPay.Application.Features.Wallets.Commands.CreateWallet;
using YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet;
using YaqeenPay.Application.Features.Wallets.Queries.GetTopUpHistory;
using YaqeenPay.Application.Features.Wallets.Queries.GetTransactionHistory;
using YaqeenPay.Application.Features.Wallets.Queries.GetWalletBalance;
using YaqeenPay.Application.Features.Wallets.Queries.GetWalletSummary;
using YaqeenPay.Application.Features.Wallets.Queries.GetWalletAnalytics;
using YaqeenPay.Application.Features.Wallets.Queries.GetWalletTransactions;

namespace YaqeenPay.API.Controllers
{
    [Authorize]
    public class WalletsController : ApiControllerBase
    {
        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance([FromQuery] GetWalletBalanceQuery query)
        {
            return Ok(await Mediator.Send(query));
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var query = new GetWalletSummaryQuery();
            return Ok(await Mediator.Send(query));
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics([FromQuery] int days = 30)
        {
            var query = new GetWalletAnalyticsQuery { Days = days };
            return Ok(await Mediator.Send(query));
        }
        
        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] GetWalletTransactionsQuery query)
        {
            return Ok(await Mediator.Send(query));
        }
        
        [HttpGet("top-ups")]
        public async Task<IActionResult> GetTopUps([FromQuery] GetTopUpHistoryQuery query)
        {
            return Ok(await Mediator.Send(query));
        }
        
        [HttpPost]
        public async Task<IActionResult> Create(CreateWalletCommand command)
        {
            return Ok(await Mediator.Send(command));
        }
        
        [HttpPost("top-up")]
        public async Task<IActionResult> TopUp([FromBody] TopUpWalletCommand command)
        {
            return Ok(await Mediator.Send(command));
        }
        
        [HttpPost("top-up/{id}/confirm")]
        public async Task<IActionResult> ConfirmTopUp(Guid id, [FromBody] ConfirmTopUpCommand command)
        {
            command.TopUpId = id;
            return Ok(await Mediator.Send(command));
        }
    }
}