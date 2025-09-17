        
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        [HttpPost("top-up/{id}/proof")]
        [RequestSizeLimit(5_000_000)] // 5MB max
        public async Task<IActionResult> UploadTopUpProof(Guid id)
        {
            var form = await Request.ReadFormAsync();
            var file = form.Files["file"];
            var notes = form["notes"].ToString();
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            // Save file to wwwroot/uploads
            var env = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            var uploadsRoot = System.IO.Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
            System.IO.Directory.CreateDirectory(uploadsRoot);

            var safeName = System.IO.Path.GetFileName(file.FileName ?? Guid.NewGuid().ToString());
            // Ensure stored file has a proper extension so browsers can infer MIME type
            var ext = System.IO.Path.GetExtension(safeName);
            if (string.IsNullOrEmpty(ext))
            {
                // map common image content types to extensions
                var ct = (file.ContentType ?? string.Empty).ToLowerInvariant();
                ext = ct switch
                {
                    "image/jpeg" => ".jpg",
                    "image/jpg" => ".jpg",
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    "image/webp" => ".webp",
                    "application/pdf" => ".pdf",
                    _ => string.Empty
                };

                // if still unknown, try to infer from filename fallback; otherwise leave empty
            }

            var baseName = System.IO.Path.GetFileNameWithoutExtension(safeName);
            var storedFileName = Guid.NewGuid().ToString() + "_" + baseName + ext;
            var storedPath = System.IO.Path.Combine(uploadsRoot, storedFileName);
            using (var fs = System.IO.File.Create(storedPath))
            {
                await file.CopyToAsync(fs);
            }

            // Build absolute URL to the uploaded file (so frontend dev server can request from API host)
            var request = HttpContext.Request;
            var baseUrl = $"{request.Scheme}://{request.Host.Value}".TrimEnd('/');
            var fileUrl = $"{baseUrl}/uploads/{storedFileName}";

            var command = new YaqeenPay.Application.Features.Wallets.Commands.TopUpWallet.UploadTopUpProofCommand
            {
                TopUpId = id,
                FileName = safeName,
                FileUrl = fileUrl,
                Notes = notes
            };
            var result = await Mediator.Send(command);
            return Ok(result);
        }
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