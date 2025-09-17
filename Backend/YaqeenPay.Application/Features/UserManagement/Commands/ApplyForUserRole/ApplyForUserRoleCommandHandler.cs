using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using YaqeenPay.Application.Features.UserManagement.Commands.ApplyForSellerRole;

namespace YaqeenPay.Application.Features.UserManagement.Commands.ApplyForUserRole;

public class ApplyForUserRoleCommandHandler : IRequestHandler<ApplyForUserRoleCommand, SellerRegistrationResponse>
{
    private readonly IMediator _mediator;

    public ApplyForUserRoleCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<SellerRegistrationResponse> Handle(ApplyForUserRoleCommand request, CancellationToken cancellationToken)
    {
        // Map ApplyForUserRoleCommand to ApplyForSellerRoleCommand
        var sellerCmd = new ApplyForSellerRoleCommand
        {
            BusinessName = request.BusinessName,
            BusinessType = request.BusinessType,
            BusinessCategory = request.BusinessCategory,
            Description = request.Description,
            PhoneNumber = request.PhoneNumber,
            Website = request.Website,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            TaxId = request.TaxId,
            Documents = request.Documents.Select(d => new YaqeenPay.Application.Features.UserManagement.Commands.ApplyForSellerRole.KycDocumentSubmission
            {
                DocumentType = d.DocumentType,
                DocumentNumber = d.DocumentNumber,
                DocumentBase64 = d.DocumentBase64,
                FileName = d.FileName
            }).ToList()
        };

        return await _mediator.Send(sellerCmd, cancellationToken);
    }
}
