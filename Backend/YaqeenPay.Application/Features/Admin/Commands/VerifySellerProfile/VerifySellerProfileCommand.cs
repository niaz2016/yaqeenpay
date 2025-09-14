using MediatR;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Admin.Commands.VerifySellerProfile;

public class VerifySellerProfileCommand : IRequest<VerifySellerProfileResponse>
{
    public Guid BusinessProfileId { get; set; }
    public SellerVerificationStatus Status { get; set; }
    public string? RejectionReason { get; set; }
}

public class VerifySellerProfileResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid BusinessProfileId { get; set; }
    public SellerVerificationStatus Status { get; set; }
}