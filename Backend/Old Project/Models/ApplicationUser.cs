using System;
using Microsoft.AspNetCore.Identity;

namespace yaqeenpay.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        // Custom properties from Architecture document
        public DateTime? PhoneVerifiedAt { get; set; }
        public DateTime? EmailVerifiedAt { get; set; }
        public KycStatus KycStatus { get; set; } = KycStatus.Pending;
        public int RiskScore { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }

    public enum KycStatus
    {
        Pending,
        Verified,
        Rejected
    }

    public enum UserRole
    {
        Buyer,
        Seller,
        Admin
    }
}