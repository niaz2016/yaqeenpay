using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Commands.ConfirmTopUp
{
    public class ConfirmTopUpCommand : IRequest<TopUpDto>
    {
        public Guid TopUpId { get; set; }
        public string ExternalReference { get; set; } = string.Empty;
    }
}