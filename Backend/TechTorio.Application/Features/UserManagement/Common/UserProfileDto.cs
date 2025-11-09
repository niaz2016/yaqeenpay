using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.UserManagement.Common;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsPhoneVerified { get; set; }
    public bool HasPassword { get; set; }
    public KycStatus KycStatus { get; set; }
    public int ProfileCompleteness { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime Created { get; set; }
}