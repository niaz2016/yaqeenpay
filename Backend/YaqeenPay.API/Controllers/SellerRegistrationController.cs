using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.UserManagement.Commands.ApplyForSellerRole;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class SellerRegistrationController : ApiControllerBase
{
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyForSellerRole(ApplyForSellerRoleCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpGet("analytics")]
    public IActionResult GetAnalytics()
    {
        // TODO: Implement seller analytics query
        // For now, return a basic response to avoid 404 errors
        var mockAnalytics = new
        {
            totalEarnings = 0.0m,
            totalOrders = 0,
            avgOrderValue = 0.0m,
            period = "30d"
        };
        return Ok(mockAnalytics);
    }
}