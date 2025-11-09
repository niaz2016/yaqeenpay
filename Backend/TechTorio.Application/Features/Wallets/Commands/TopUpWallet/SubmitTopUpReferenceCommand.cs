using MediatR;
using TechTorio.Application.Common.Models;

namespace TechTorio.Application.Features.Wallets.Commands.TopUpWallet
{
    public class SubmitTopUpReferenceCommand : IRequest<TopUpDto>
    {
        public Guid TopUpId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
    }
}
