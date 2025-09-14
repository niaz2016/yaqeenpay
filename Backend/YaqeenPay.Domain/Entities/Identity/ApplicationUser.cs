using Microsoft.AspNetCore.Identity;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Domain.Entities.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    // Identity properties
    public List<RefreshToken> RefreshTokens { get; set; } = new();
    public DateTime Created { get; set; } = DateTime.UtcNow;
    
    // Basic profile
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    
    // Address information
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }
    
    // Verification statuses
    public DateTime? PhoneVerifiedAt { get; set; }
    public DateTime? EmailVerifiedAt { get; set; }
    public Enums.KycStatus KycStatus { get; set; } = Enums.KycStatus.Pending;
    public int RiskScore { get; set; } = 0;
    
    // Profile completion tracking
    public int ProfileCompleteness { get; set; } = 0;
    
    // Navigation properties
    public ICollection<KycDocument> KycDocuments { get; set; } = new List<KycDocument>();
    public BusinessProfile? BusinessProfile { get; set; }
    
    // Helper methods
    public bool IsEmailVerified => EmailVerifiedAt.HasValue;
    public bool IsPhoneVerified => PhoneVerifiedAt.HasValue;
    public bool HasCompletedKyc => KycStatus == Enums.KycStatus.Verified;
    public string FullName => $"{FirstName} {LastName}".Trim();
    
    public void UpdateProfileCompleteness()
    {
        int completeness = 0;
        
        // Basic info - 40%
        if (!string.IsNullOrEmpty(FirstName)) completeness += 10;
        if (!string.IsNullOrEmpty(LastName)) completeness += 10;
        if (!string.IsNullOrEmpty(Email) && EmailVerifiedAt.HasValue) completeness += 10;
        if (!string.IsNullOrEmpty(PhoneNumber) && PhoneVerifiedAt.HasValue) completeness += 10;
        
        // Additional info - 30%
        if (!string.IsNullOrEmpty(ProfileImageUrl)) completeness += 5;
        if (DateOfBirth.HasValue) completeness += 5;
        if (!string.IsNullOrEmpty(Gender)) completeness += 5;
        if (!string.IsNullOrEmpty(Address)) completeness += 5;
        if (!string.IsNullOrEmpty(City) && !string.IsNullOrEmpty(Country)) completeness += 10;
        
        // KYC - 30%
        if (KycStatus == Enums.KycStatus.Submitted) completeness += 10;
        if (KycStatus == Enums.KycStatus.InReview) completeness += 20;
        if (KycStatus == Enums.KycStatus.Verified) completeness += 30;
        
        ProfileCompleteness = Math.Min(completeness, 100);
    }
}