using MediatR;
using YaqeenPay.Application.Features.UserManagement.Common;

namespace YaqeenPay.Application.Features.UserManagement.Commands.CreateBusinessProfile;

public class CreateBusinessProfileCommand : IRequest<BusinessProfileDto>
{
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string BusinessCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
}