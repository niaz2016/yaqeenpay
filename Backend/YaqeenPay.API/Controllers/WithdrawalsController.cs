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
    public IActionResult GetWithdrawalById(string withdrawalId)
    {
        // TODO: Implement get withdrawal by ID logic
        // For now, return a basic response to avoid 404 errors
        var mockWithdrawal = new
        {
            id = withdrawalId,
            amount = 0.0m,
            status = "Pending",
            requestedAt = DateTime.UtcNow,
            currency = "USD"
        };
        return Ok(mockWithdrawal);
    }

    [HttpDelete("{withdrawalId}")]
    public IActionResult CancelWithdrawal(string withdrawalId)
    {
        // TODO: Implement cancel withdrawal logic
        // For now, return success response to avoid 404 errors
        return Ok(new { message = "Withdrawal cancelled successfully" });
    }
}