using MediatR;
using System;

namespace YaqeenPay.Application.Features.Admin.Commands.LedgerAdjustment
{
    public class LedgerAdjustmentCommand : IRequest<LedgerAdjustmentResponse>
    {
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public string Reason { get; set; } = string.Empty;
        public bool IsCredit { get; set; } // true = credit, false = debit
    }

    public class LedgerAdjustmentResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}