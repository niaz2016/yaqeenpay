using MediatR;
using TechTorio.Application.Features.UserManagement.Common;

namespace TechTorio.Application.Features.UserManagement.Commands.UpdateProfile;

public class UpdateProfileCommand : IRequest<UserProfileDto>
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public string? ProfileImageUrl { get; set; }
}