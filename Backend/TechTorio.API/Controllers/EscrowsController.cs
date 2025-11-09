using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TechTorio.API.Controllers;
using TechTorio.Application.Features.Escrows.Commands.CreateEscrow;
using TechTorio.Application.Features.Escrows.Commands.ReleaseEscrow;
using TechTorio.Application.Features.Escrows.Queries.GetEscrowById;
using TechTorio.Application.Features.Escrows.Queries.GetEscrowsList;

namespace TechTorio.API.Controllers;

[Authorize]
public class EscrowsController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetEscrowsListQuery query)
    {
        return Ok(await Mediator.Send(query));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await Mediator.Send(new GetEscrowByIdQuery { EscrowId = id }));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateEscrowCommand command)
    {
        return Ok(await Mediator.Send(command));
    }

    [HttpPost("{id}/release")]
    public async Task<IActionResult> Release(Guid id)
    {
        return Ok(await Mediator.Send(new ReleaseEscrowCommand { EscrowId = id }));
    }
}