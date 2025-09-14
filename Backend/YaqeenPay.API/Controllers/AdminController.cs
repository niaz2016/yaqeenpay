using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.Application.Features.Admin.Commands.VerifyKycDocument;
using YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingKycDocuments;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingSellerProfiles;
using YaqeenPay.Application.Features.Admin.Queries.GetAdminStats;
using YaqeenPay.Application.Features.Admin.Queries.GetUsers;

namespace YaqeenPay.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ApiControllerBase
{
    [HttpPost("topups/review")]
    public async Task<IActionResult> ReviewTopUp([FromBody] YaqeenPay.Application.Features.Admin.Commands.ReviewTopUp.ReviewTopUpCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
    [HttpGet("topups")]
    public async Task<IActionResult> GetTopUps([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var result = await Mediator.Send(new YaqeenPay.Application.Features.Admin.Queries.GetTopUps.GetTopUpsQuery { Page = page, PageSize = pageSize });
        return Ok(result);
    }
    [HttpPost("users/action")]
    public async Task<IActionResult> PerformUserAction([FromBody] UserActionRequestDto request)
    {
        if (request.Action?.ToLower() == "activate")
        {
            // Activate user (set EmailConfirmed = true)
            // You may want to add more logic here (e.g., audit log, notification)
            var userManager = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Identity.UserManager<YaqeenPay.Domain.Entities.Identity.ApplicationUser>)) as Microsoft.AspNetCore.Identity.UserManager<YaqeenPay.Domain.Entities.Identity.ApplicationUser>;
            if (userManager == null)
                return StatusCode(500, "UserManager not available");
            var user = await userManager.FindByIdAsync(request.UserId);
            if (user == null)
                return NotFound();
            user.EmailConfirmed = true;
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return StatusCode(500, result.Errors);
            return Ok();
        }
        return BadRequest("Unsupported action");
    }

    public class UserActionRequestDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }
    [HttpPost("sellers/review")]
    public async Task<IActionResult> ReviewSellerApplication([FromBody] YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile.VerifySellerProfileCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var result = await Mediator.Send(new YaqeenPay.Application.Features.Admin.Queries.GetOrders.GetOrdersQuery());
            return Ok(result);
        }
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var result = await Mediator.Send(new GetUsersQuery());
        return Ok(result);
    }
    [HttpGet("audit/logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] YaqeenPay.Application.Features.Admin.Queries.GetAuditLogs.GetAuditLogsQuery query)
    {
        var result = await Mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("ledger/adjust")]
    public async Task<IActionResult> AdjustLedger([FromBody] YaqeenPay.Application.Features.Admin.Commands.LedgerAdjustment.LedgerAdjustmentCommand command)
    {
        var result = await Mediator.Send(command);
        if (!result.Success)
            return BadRequest(result.Message);
        return Ok(result);
    }
    [HttpGet("stats")]
    public async Task<IActionResult> GetAdminStats()
    {
        return Ok(await Mediator.Send(new GetAdminStatsQuery()));
    }

    [HttpGet("kyc/pending")]
    public async Task<IActionResult> GetPendingKycDocuments()
    {
        return Ok(await Mediator.Send(new GetPendingKycDocumentsQuery()));
    }

    [HttpPost("kyc/verify")]
    public async Task<IActionResult> VerifyKycDocument(VerifyKycDocumentCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpGet("seller/pending")]
    [HttpGet("sellers/pending")]
    public async Task<IActionResult> GetPendingSellerProfiles()
    {
        return Ok(await Mediator.Send(new GetPendingSellerProfilesQuery()));
    }

    [HttpPost("seller/verify")]
    public async Task<IActionResult> VerifySellerProfile(VerifySellerProfileCommand command)
    {
        return Ok(await Mediator.Send(command));
    }
}