using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Application.Features.UserManagement.Commands.SubmitKycDocument;
using YaqeenPay.Application.Features.UserManagement.Queries.GetKycDocuments;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class KycController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDocuments()
    {
        var result = await Mediator.Send(new GetKycDocumentsQuery());
        return Ok(ApiResponse<object>.SuccessResponse(result, "KYC documents retrieved successfully"));
    }

    [HttpPost]
    [RequestSizeLimit(52_428_800)] // 50MB max for KYC documents
    public async Task<IActionResult> SubmitDocument(SubmitKycDocumentCommand command)
    {
        var result = await Mediator.Send(command);
        return Ok(ApiResponse<object>.SuccessResponse(result, "KYC document submitted successfully"));
    }
}