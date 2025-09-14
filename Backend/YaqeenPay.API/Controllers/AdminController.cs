using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.Admin.Commands.VerifyKycDocument;
using YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingKycDocuments;
using YaqeenPay.Application.Features.Admin.Queries.GetPendingSellerProfiles;

namespace YaqeenPay.API.Controllers;

[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
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