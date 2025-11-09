using System;

namespace TechTorio.Domain.Entities
{
    /// <summary>
    /// Tracks devices that users have logged in from
    /// </summary>
    public class UserDevice
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        
        /// <summary>
        /// Unique device identifier (fingerprint based on user agent, screen resolution, etc.)
        /// </summary>
        public string DeviceFingerprint { get; set; } = string.Empty;
        
        /// <summary>
        /// User agent string from browser
        /// </summary>
        public string UserAgent { get; set; } = string.Empty;
        
        /// <summary>
        /// Device type (Mobile, Desktop, Tablet, etc.)
        /// </summary>
        public string DeviceType { get; set; } = string.Empty;
        
        /// <summary>
        /// Browser name and version
        /// </summary>
        public string Browser { get; set; } = string.Empty;
        
        /// <summary>
        /// Operating system
        /// </summary>
        public string OperatingSystem { get; set; } = string.Empty;
        
        /// <summary>
        /// IP address when device was first registered
        /// </summary>
        public string IpAddress { get; set; } = string.Empty;
        
        /// <summary>
        /// Whether this device has been verified (via OTP)
        /// </summary>
        public bool IsVerified { get; set; }
        
        /// <summary>
        /// Whether this device is trusted (user can skip OTP)
        /// </summary>
        public bool IsTrusted { get; set; }
        
        /// <summary>
        /// First time this device was used to login
        /// </summary>
        public DateTime FirstSeenAt { get; set; }
        
        /// <summary>
        /// Last time this device was used to login
        /// </summary>
        public DateTime LastSeenAt { get; set; }
        
        /// <summary>
        /// Friendly name given by user (optional)
        /// </summary>
        public string? DeviceName { get; set; }
        
        /// <summary>
        /// Whether this device record is still active
        /// </summary>
        public bool IsActive { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
