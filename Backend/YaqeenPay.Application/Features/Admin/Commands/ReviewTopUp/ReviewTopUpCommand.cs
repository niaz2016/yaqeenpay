using MediatR;
using System;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Admin.Commands.ReviewTopUp
{
    public class ReviewTopUpCommand : IRequest<bool>
    {
        public Guid TopUpId { get; set; }
        public TopUpReviewStatus ReviewStatus { get; set; } // Paid, Suspicious, NotPaid
        public string? Notes { get; set; }
    }

    public enum TopUpReviewStatus
    {
        Paid,
        Suspicious,
        NotPaid
    }
}
