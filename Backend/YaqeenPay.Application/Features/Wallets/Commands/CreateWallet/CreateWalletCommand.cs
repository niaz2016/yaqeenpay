using System.Text.Json.Serialization;
using MediatR;
using YaqeenPay.Application.Common.Models;

namespace YaqeenPay.Application.Features.Wallets.Commands.CreateWallet
{
    public class CreateWalletCommand : IRequest<WalletDto>
    {
        [JsonIgnore]
        public Guid UserId { get; set; }
        public string Currency { get; set; } = "PKR";
        // Removed Type property as we now use unified wallet system
    }
}