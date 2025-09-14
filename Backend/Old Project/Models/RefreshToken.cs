using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace yaqeenpay.Models
{
    [Index(nameof(UserId))]
    public class RefreshToken
    {
        [Key]
        public Guid Id { get; set; }
        
        public Guid UserId { get; set; }
        
        [Required]
        public string TokenHash { get; set; } = string.Empty;
        
        public DateTime ExpiresAt { get; set; }
        
        public DateTime? RevokedAt { get; set; }
        
        public Guid? ReplacedById { get; set; }
        
        [ForeignKey(nameof(ReplacedById))]
        public RefreshToken? ReplacedByToken { get; set; }
        
        [ForeignKey(nameof(UserId))]
        public ApplicationUser User { get; set; } = null!;
        
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
        
        public bool IsRevoked => RevokedAt != null;
        
        public bool IsActive => !IsRevoked && !IsExpired;
    }
}