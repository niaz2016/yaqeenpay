using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.UserManagement.Commands.SubmitKycDocument;
using YaqeenPay.Application.Features.UserManagement.Queries.GetKycDocuments;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class KycController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetDocuments()
    {
        return Ok(await Mediator.Send(new GetKycDocumentsQuery()));
    }

    [HttpPost]
    public async Task<IActionResult> SubmitDocument(SubmitKycDocumentCommand command)
    {
        return Ok(await Mediator.Send(command));
    }
}