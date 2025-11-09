using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechTorio.Application.Features.Admin.Commands.VerifyKycDocument;
using TechTorio.Application.Features.Admin.Commands.VerifySellerProfile;
using TechTorio.Application.Features.Admin.Queries.GetAdminStats;
using TechTorio.Application.Features.Admin.Queries.GetPendingKycDocuments;
using TechTorio.Application.Features.Admin.Queries.GetPendingSellerProfiles;
using TechTorio.Application.Features.Admin.Queries.GetUsers;
using TechTorio.Application.Features.AdminSettings.Commands.CreateAdminSetting;
using TechTorio.Application.Features.AdminSettings.Commands.UpdateAdminSetting;
using TechTorio.Application.Features.AdminSettings.Common;
using TechTorio.Application.Features.AdminSettings.Queries.GetAdminSettings;

namespace TechTorio.API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ApiControllerBase
{
    [HttpPost("topups/review")]
    public async Task<IActionResult> ReviewTopUp([FromBody] TechTorio.Application.Features.Admin.Commands.ReviewTopUp.ReviewTopUpCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
    [HttpGet("topups")]
    public async Task<IActionResult> GetTopUps([FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? status = null, [FromQuery] DateTime? dateFrom = null, [FromQuery] DateTime? dateTo = null)
    {
        // Call the admin GetTopUps query which returns all top-ups (no current-user filter)
        var query = new TechTorio.Application.Features.Admin.Queries.GetTopUps.GetTopUpsQuery
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

        var userManager = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Identity.UserManager<TechTorio.Domain.Entities.Identity.ApplicationUser>)) as Microsoft.AspNetCore.Identity.UserManager<TechTorio.Domain.Entities.Identity.ApplicationUser>;
        var roleManager = HttpContext.RequestServices.GetService(typeof(Microsoft.AspNetCore.Identity.RoleManager<TechTorio.Domain.Entities.Identity.ApplicationRole>)) as Microsoft.AspNetCore.Identity.RoleManager<TechTorio.Domain.Entities.Identity.ApplicationRole>;
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
    public async Task<IActionResult> ReviewSellerApplication([FromBody] TechTorio.Application.Features.Admin.Commands.VerifySellerProfile.VerifySellerProfileCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(result);
    }
    [HttpPost("withdrawals/{withdrawalId}/approve")]
    public async Task<IActionResult> ApproveWithdrawal([FromRoute] string withdrawalId)
    {
        if (!Guid.TryParse(withdrawalId, out var id))
            return BadRequest("Invalid withdrawal ID");

        var cmd = new TechTorio.Application.Features.Admin.Commands.ApproveWithdrawal.ApproveWithdrawalCommand
        {
            WithdrawalId = id,
            ChannelReference = string.Empty
        };

        var success = await Mediator.Send(cmd);
        if (!success)
            return BadRequest("Unable to approve/settle withdrawal");
        return Ok(new { message = "Withdrawal approved" });
    }
    [HttpPost("withdrawals/{withdrawalId}/fail")]
    public async Task<IActionResult> FailWithdrawal([FromRoute] string withdrawalId, [FromBody] FailWithdrawalRequestDto request)
    {
        if (!Guid.TryParse(withdrawalId, out var id))
            return BadRequest("Invalid withdrawal ID");

        var cmd = new TechTorio.Application.Features.Admin.Commands.FailWithdrawal.FailWithdrawalCommand
        {
            WithdrawalId = id,
            FailureReason = request.FailureReason ?? "Withdrawal failed"
        };

        var success = await Mediator.Send(cmd);
        if (!success)
            return BadRequest("Unable to fail withdrawal");
        return Ok(new { message = "Withdrawal failed and amount refunded to wallet" });
    }

    public class FailWithdrawalRequestDto
    {
        public string? FailureReason { get; set; }
    }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var result = await Mediator.Send(new TechTorio.Application.Features.Admin.Queries.GetOrders.GetOrdersQuery());
            return Ok(result);
        }
        [HttpGet("withdrawals")]
        public async Task<IActionResult> GetWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? sellerId = null)
        {
            var query = new TechTorio.Application.Features.Admin.Queries.GetWithdrawals.GetWithdrawalsQuery
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
            var db = HttpContext.RequestServices.GetRequiredService<TechTorio.Application.Common.Interfaces.IApplicationDbContext>();

            // gather counts grouped by status
            var total = await db.Withdrawals.CountAsync();
            var initiated = await db.Withdrawals.Where(w => w.Status == TechTorio.Domain.Entities.WithdrawalStatus.Initiated).CountAsync();
            var pendingProvider = await db.Withdrawals.Where(w => w.Status == TechTorio.Domain.Entities.WithdrawalStatus.PendingProvider).CountAsync();
            var settled = await db.Withdrawals.Where(w => w.Status == TechTorio.Domain.Entities.WithdrawalStatus.Settled).CountAsync();
            var failed = await db.Withdrawals.Where(w => w.Status == TechTorio.Domain.Entities.WithdrawalStatus.Failed).CountAsync();
            var reversed = await db.Withdrawals.Where(w => w.Status == TechTorio.Domain.Entities.WithdrawalStatus.Reversed).CountAsync();

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
    public async Task<IActionResult> GetAuditLogs([FromQuery] TechTorio.Application.Features.Admin.Queries.GetAuditLogs.GetAuditLogsQuery query)
    {
        var result = await Mediator.Send(query);
        return Ok(result);
    }

    [HttpPost("ledger/adjust")]
    public async Task<IActionResult> AdjustLedger([FromBody] TechTorio.Application.Features.Admin.Commands.LedgerAdjustment.LedgerAdjustmentCommand command)
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
        var db = HttpContext.RequestServices.GetRequiredService<TechTorio.Application.Common.Interfaces.IApplicationDbContext>();
        
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
        var db = HttpContext.RequestServices.GetRequiredService<TechTorio.Application.Common.Interfaces.IApplicationDbContext>();

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
            .Select(x => new
            {
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

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }
    
    [HttpPost("email/create")]
    public async Task<IActionResult> CreateEmailUser([FromBody] CreateEmailUserDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Username and password are required" });

        // Validate username format
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.Username, "^[a-z0-9]+$"))
            return BadRequest(new { message = "Username must contain only lowercase letters and numbers" });

        if (request.Username.Length < 3 || request.Username.Length > 20)
            return BadRequest(new { message = "Username must be between 3 and 20 characters" });

        try
        {
            var emailAddress = $"{request.Username}@techtorio.online";
            var mailboxPath = $"techtorio.online/{request.Username}/";

            // Step 1: Generate password hash using doveadm
            var hashProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/usr/bin/doveadm",
                    Arguments = $"pw -s SHA512-CRYPT -p {request.Password}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            hashProcess.Start();
            var passwordHash = await hashProcess.StandardOutput.ReadToEndAsync();
            var hashError = await hashProcess.StandardError.ReadToEndAsync();
            await hashProcess.WaitForExitAsync();

            if (hashProcess.ExitCode != 0 || string.IsNullOrWhiteSpace(passwordHash))
                throw new Exception($"Failed to generate password hash: {hashError}");

            passwordHash = passwordHash.Trim();

            // Step 2: Add user to /etc/dovecot/passwd
            var passwdEntry = $"{emailAddress}:{passwordHash}:5000:5000::/var/mail/vhosts/{mailboxPath}::";
            var appendPasswdProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"echo '{passwdEntry}' | sudo tee -a /etc/dovecot/passwd\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            appendPasswdProcess.Start();
            await appendPasswdProcess.StandardOutput.ReadToEndAsync();
            var passwdError = await appendPasswdProcess.StandardError.ReadToEndAsync();
            await appendPasswdProcess.WaitForExitAsync();

            if (appendPasswdProcess.ExitCode != 0)
                throw new Exception($"Failed to add user to dovecot passwd: {passwdError}");

            // Step 3: Add virtual mailbox mapping
            var virtualEntry = $"{emailAddress} {mailboxPath}";
            var appendVirtualProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"echo '{virtualEntry}' | sudo tee -a /etc/postfix/virtual_mailbox\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            appendVirtualProcess.Start();
            await appendVirtualProcess.StandardOutput.ReadToEndAsync();
            var virtualError = await appendVirtualProcess.StandardError.ReadToEndAsync();
            await appendVirtualProcess.WaitForExitAsync();

            if (appendVirtualProcess.ExitCode != 0)
                throw new Exception($"Failed to add virtual mailbox mapping: {virtualError}");

            // Step 4: Update Postfix database
            var postmapProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/usr/bin/sudo",
                    Arguments = "postmap /etc/postfix/virtual_mailbox",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            postmapProcess.Start();
            await postmapProcess.StandardOutput.ReadToEndAsync();
            var postmapError = await postmapProcess.StandardError.ReadToEndAsync();
            await postmapProcess.WaitForExitAsync();

            if (postmapProcess.ExitCode != 0)
                throw new Exception($"Failed to update postfix database: {postmapError}");

            // Step 5: Create mailbox directory structure
            var mkdirProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/bin/bash",
                    Arguments = $"-c \"sudo mkdir -p /var/mail/vhosts/{mailboxPath}{{cur,new,tmp}}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            mkdirProcess.Start();
            await mkdirProcess.StandardOutput.ReadToEndAsync();
            var mkdirError = await mkdirProcess.StandardError.ReadToEndAsync();
            await mkdirProcess.WaitForExitAsync();

            if (mkdirProcess.ExitCode != 0)
                throw new Exception($"Failed to create mailbox directories: {mkdirError}");

            // Step 6: Set proper ownership
            var chownProcess = new System.Diagnostics.Process
            {
                StartInfo = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = "/usr/bin/sudo",
                    Arguments = $"chown -R vmail:vmail /var/mail/vhosts/{mailboxPath}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            chownProcess.Start();
            await chownProcess.StandardOutput.ReadToEndAsync();
            var chownError = await chownProcess.StandardError.ReadToEndAsync();
            await chownProcess.WaitForExitAsync();

            if (chownProcess.ExitCode != 0)
                throw new Exception($"Failed to set mailbox ownership: {chownError}");

            return Ok(new
            {
                message = "Email account created successfully",
                email = emailAddress,
                username = request.Username,
                server = "mail.techtorio.online",
                imap = "993 (SSL/TLS)",
                smtp = "465 (SSL/TLS) or 587 (STARTTLS)"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Failed to create email account: {ex.Message}" });
        }
    }

    public class CreateEmailUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

}