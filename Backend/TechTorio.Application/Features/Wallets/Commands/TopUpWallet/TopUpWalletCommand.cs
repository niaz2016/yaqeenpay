using MediatR;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wallets.Commands.TopUpWallet
{
    public class TopUpWalletCommand : IRequest<TopUpDto>
    {
        public Guid? WalletId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public TopUpChannel Channel { get; set; } = TopUpChannel.JazzCash;
    }
}