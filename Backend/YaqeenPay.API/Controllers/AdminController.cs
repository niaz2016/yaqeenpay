using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YaqeenPay.Application.Features.Admin.Commands.VerifyKycDocument;
using YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile;
using YaqeenPay.Application.Features.Admin.Queries.GetAdminStats;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingKycDocuments;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingSellerProfiles;
using YaqeenPay.Application.Features.Admin.Queries.GetUsers;
using YaqeenPay.Application.Features.AdminSettings.Commands.CreateAdminSetting;
using YaqeenPay.Application.Features.AdminSettings.Commands.UpdateAdminSetting;
using YaqeenPay.Application.Features.AdminSettings.Common;
using YaqeenPay.Application.Features.AdminSettings.Queries.GetAdminSettings;

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
    public async Task<IActionResult> GetTopUps([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? status = null, [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        // Call the admin GetTopUps query which returns all top-ups (no current-user filter)
        var query = new YaqeenPay.Application.Features.Admin.Queries.GetTopUps.GetTopUpsQuery
        {
            Page = page,
            PageSize = pageSize
        };

        var result = await Mediator.Send(query);
        // Admin handler returns a list of TopUpDto
        return Ok(result);
    }
    [HttpPost("users/action")]
    public async Task<IActionResult> PerformUserAction([FromBody] UserActionRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Action))
            return BadRequest("Action is required");

        var userManager = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Identity.UserManager<YaqeenPay.Domain.Entities.Identity.ApplicationUser>)) as Microsoft.AspNetCore.Identity.UserManager<YaqeenPay.Domain.Entities.Identity.ApplicationUser>;
        var roleManager = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Identity.RoleManager<YaqeenPay.Domain.Entities.Identity.ApplicationRole>)) as Microsoft.AspNetCore.Identity.RoleManager<YaqeenPay.Domain.Entities.Identity.ApplicationRole>;
        if (userManager == null)
            return StatusCode(500, "UserManager not available");

        var user = await userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return NotFound();

        var action = request.Action.Trim().ToLowerInvariant();
        if (action == "activate")
        {
            // Activate user (confirm email)
            user.EmailConfirmed = true;
            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return StatusCode(500, result.Errors);
            return Ok();
        }

        if (action == "deactivate")
        {
            // Deactivate user by setting a long LockoutEnd date (effectively disabling login)
            // Ensure lockout is enabled on the user
            if (!await userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = DateTimeOffset.UtcNow.AddYears(100);
                var setResult = await userManager.SetLockoutEndDateAsync(user, lockoutEnd);
                if (!setResult.Succeeded)
                    return StatusCode(500, setResult.Errors);
            }
            return Ok();
        }

        if (action == "changerole" || action == "changeRole" || action == "change-role")
        {
            if (string.IsNullOrWhiteSpace(request.NewRole))
                return BadRequest("NewRole is required for changeRole action");

            if (roleManager == null)
                return StatusCode(500, "RoleManager not available");

            // Ensure role exists
            var roleExists = await roleManager.RoleExistsAsync(request.NewRole);
            if (!roleExists)
                return BadRequest($"Role '{request.NewRole}' does not exist");

            var currentRoles = await userManager.GetRolesAsync(user);
            var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
                return StatusCode(500, removeResult.Errors);

            var addResult = await userManager.AddToRoleAsync(user, request.NewRole);
            if (!addResult.Succeeded)
                return StatusCode(500, addResult.Errors);

            return Ok();
        }

        return BadRequest("Unsupported action");
    }

    public class UserActionRequestDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Reason { get; set; }
        public string? NewRole { get; set; }
    }
    public class ApproveWithdrawalRequestDto
    {
        public string? ChannelReference { get; set; }
    }
    [HttpPost("sellers/review")]
    public async Task<IActionResult> ReviewSellerApplication([FromBody] YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile.VerifySellerProfileCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
    [HttpPost("withdrawals/{withdrawalId}/approve")]
    public async Task<IActionResult> ApproveWithdrawal([FromRoute] string withdrawalId)
    {
        if (!Guid.TryParse(withdrawalId, out var id))
            return BadRequest("Invalid withdrawal ID");

        var cmd = new YaqeenPay.Application.Features.Admin.Commands.ApproveWithdrawal.ApproveWithdrawalCommand
        {
            WithdrawalId = id,
            ChannelReference = string.Empty
        };

        var success = await Mediator.Send(cmd);
        if (!success)
            return BadRequest("Unable to approve/settle withdrawal");
        return Ok(new { message = "Withdrawal approved" });
    }
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var result = await Mediator.Send(new YaqeenPay.Application.Features.Admin.Queries.GetOrders.GetOrdersQuery());
            return Ok(result);
        }
        [HttpGet("withdrawals")]
        public async Task<IActionResult> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? sellerId = null)
        {
            var query = new YaqeenPay.Application.Features.Admin.Queries.GetWithdrawals.GetWithdrawalsQuery
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                Status = status,
                SellerId = sellerId
            };

            var result = await Mediator.Send(query);
            return Ok(result);
        }
        [HttpGet("withdrawals/stats")]
        public async Task<IActionResult> GetWithdrawalStats()
        {
            // resolve application DB context
            var db = HttpContext.RequestServices.GetRequiredService<YaqeenPay.Application.Common.Interfaces.IApplicationDbContext>();

            // gather counts grouped by status
            var total = await db.Withdrawals.CountAsync();
            var initiated = await db.Withdrawals.Where(w => w.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.Initiated).CountAsync();
            var pendingProvider = await db.Withdrawals.Where(w => w.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.PendingProvider).CountAsync();
            var settled = await db.Withdrawals.Where(w => w.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.Settled).CountAsync();
            var failed = await db.Withdrawals.Where(w => w.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.Failed).CountAsync();
            var reversed = await db.Withdrawals.Where(w => w.Status == YaqeenPay.Domain.Entities.WithdrawalStatus.Reversed).CountAsync();

            var resp = new {
                Total = total,
                Initiated = initiated,
                PendingProvider = pendingProvider,
                Settled = settled,
                Failed = failed,
                Reversed = reversed
            };

            return Ok(resp);
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

    [HttpGet("bank-sms-payments")]
    public async Task<IActionResult> GetBankSmsPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] bool? processed = null)
    {
        var db = HttpContext.RequestServices.GetRequiredService<YaqeenPay.Application.Common.Interfaces.IApplicationDbContext>();
        
        var query = db.BankSmsPayments.AsQueryable();
        
        if (processed.HasValue)
        {
            query = query.Where(x => x.Processed == processed.Value);
        }
        
        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return Ok(new { 
            items, 
            totalCount, 
            page, 
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpGet("wallet-topup-locks")]
    public async Task<IActionResult> GetWalletTopupLocks([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] int? status = null)
    {
        var db = HttpContext.RequestServices.GetRequiredService<YaqeenPay.Application.Common.Interfaces.IApplicationDbContext>();
        
        var query = db.WalletTopupLocks.AsQueryable();
        
        if (status.HasValue)
        {
            query = query.Where(x => (int)x.Status == status.Value);
        }
        
        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new {
                x.Id,
                x.UserId,
                Amount = x.Amount.Amount,
                Currency = x.Amount.Currency,
                x.LockedAt,
                x.ExpiresAt,
                x.Status,
                x.TransactionReference,
                x.CreatedAt
            })
            .ToListAsync();
        
        return Ok(new { 
            items, 
            totalCount, 
            page, 
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }
}