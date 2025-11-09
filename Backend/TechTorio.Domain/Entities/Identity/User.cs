using System;
using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities.Identity
{
    public enum KycStatus
    {
        Pending,
        Verified,
        Rejected,
        Submitted,
        InReview
    }

    public enum UserRole
    {
        Buyer,
        Seller,
        Admin
    }

    //// This class represents the domain entity, not the actual IdentityUser implementation
    //// The actual implementation will be in the Infrastructure layer
    //public class User : AuditableEntity
    //{
    //    public string Email { get; set; } = string.Empty;
    //    public string PhoneNumber { get; set; } = string.Empty;
    //    public DateTime? PhoneVerifiedAt { get; set; }
    //    public DateTime? EmailVerifiedAt { get; set; }
    //    public KycStatus KycStatus { get; set; } = KycStatus.Pending;
    //    public int RiskScore { get; set; } = 0;
    //}

    //public class RefreshToken : BaseEntity
    //{
    //    public Guid UserId { get; set; }
    //    public string TokenHash { get; set; } = string.Empty;
    //    public DateTime ExpiresAt { get; set; }
    //    public DateTime? RevokedAt { get; set; }
    //    public Guid? ReplacedById { get; set; }
    //    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    //    public bool IsRevoked => RevokedAt != null;
    //    public bool IsActive => !IsRevoked && !IsExpired;
    //}
}