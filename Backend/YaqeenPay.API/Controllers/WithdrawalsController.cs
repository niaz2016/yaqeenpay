using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.Withdrawals.Commands.RequestWithdrawal;
using YaqeenPay.Application.Features.Withdrawals.Queries.GetWithdrawals;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class WithdrawalsController : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> RequestWithdrawal([FromBody] RequestWithdrawalCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetWithdrawals([FromQuery] GetWithdrawalsQuery query)
    {
        var result = await Mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{withdrawalId}")]
    public async Task<IActionResult> GetWithdrawalById(string withdrawalId)
    {
        if (!Guid.TryParse(withdrawalId, out var id))
            return BadRequest("Invalid withdrawal ID");

        var result = await Mediator.Send(new YaqeenPay.Application.Features.Withdrawals.Queries.GetWithdrawalById.GetWithdrawalByIdQuery(id));
        if (result == null)
            return NotFound();
        return Ok(result);
    }

    [HttpDelete("{withdrawalId}")]
    public async Task<IActionResult> CancelWithdrawal(string withdrawalId)
    {
        if (!Guid.TryParse(withdrawalId, out var id))
            return BadRequest("Invalid withdrawal ID");

        var result = await Mediator.Send(new YaqeenPay.Application.Features.Withdrawals.Commands.CancelWithdrawal.CancelWithdrawalCommand(id));
        if (!result)
            return BadRequest("Unable to cancel withdrawal. It may not exist or cannot be cancelled at this stage.");
        return Ok(new { message = "Withdrawal cancelled successfully" });
    }
}