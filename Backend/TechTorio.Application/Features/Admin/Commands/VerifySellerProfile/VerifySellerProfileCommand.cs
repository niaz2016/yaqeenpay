using MediatR;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Admin.Commands.VerifySellerProfile;

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