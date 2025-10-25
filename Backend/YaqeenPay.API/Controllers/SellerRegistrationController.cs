using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.UserManagement.Commands.ApplyForSellerRole;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class SellerRegistrationController : ApiControllerBase
{
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyForSellerRole(ApplyForSellerRoleCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(ApiResponse<SellerRegistrationResponse>.SuccessResponse(result, result.Message));
    }

    // Compatibility: accept ApplyForUserRoleCommand at the same endpoint
    [HttpPost("apply-user")]
    public async Task<IActionResult> ApplyForUserRole(YaqeenPay.Application.Features.UserManagement.Commands.ApplyForUserRole.ApplyForUserRoleCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(ApiResponse<object>.SuccessResponse(result, "User role application submitted successfully"));
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
        return Ok(ApiResponse<object>.SuccessResponse(mockAnalytics, "Analytics retrieved successfully"));
    }
}