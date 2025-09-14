using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using YaqeenPay.API.Controllers;
using YaqeenPay.Application.Features.Disputes.Commands.ResolveDispute;
using YaqeenPay.Application.Features.Disputes.Commands.AddDisputeEvidence;
using YaqeenPay.Application.Features.Disputes.Commands.EscalateDispute;
using YaqeenPay.Application.Features.Disputes.Commands.AddAdminNotes;
using YaqeenPay.Application.Features.Disputes.Queries.GetDisputeById;
using YaqeenPay.Application.Features.Disputes.Queries.GetDisputesList;
using YaqeenPay.Application.Features.Disputes.Queries.GetUserDisputes;

namespace YaqeenPay.API.Controllers;

[Authorize]
public class DisputesController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetDisputesListQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserDisputes()
    {
        return Ok(await Mediator.Send(new GetUserDisputesQuery()));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await Mediator.Send(new GetDisputeByIdQuery { DisputeId = id }));
    }

    [HttpPost("{id}/evidence")]
    public async Task<IActionResult> AddEvidence(Guid id, AddDisputeEvidenceCommand command)
    {
        command.DisputeId = id;
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/escalate")]
    public async Task<IActionResult> Escalate(Guid id)
    {
        return Ok(await Mediator.Send(new EscalateDisputeCommand { DisputeId = id }));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/notes")]
    public async Task<IActionResult> AddAdminNotes(Guid id, AddAdminNotesCommand command)
    {
        command.DisputeId = id;
        return Ok(await Mediator.Send(command));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, ResolveDisputeCommand command)
    {
        command.DisputeId = id;
        return Ok(await Mediator.Send(command));
    }
}