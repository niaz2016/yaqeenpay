using MediatR;

namespace TechTorio.Application.Features.Payments.Commands
{
    public class ReleaseFundsCommand : IRequest<bool>
    {
        public string TransactionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
