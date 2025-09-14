using MediatR;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Entities;

namespace YaqeenPay.Application.Features.Withdrawals.Commands.RequestWithdrawal
{
    public class RequestWithdrawalCommand : IRequest<WithdrawalDto>
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public string PaymentMethod { get; set; } = null!;
        public string? Notes { get; set; }
    }
}