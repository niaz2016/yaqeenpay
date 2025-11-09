namespace TechTorio.Domain.Entities;

public class SmsRateLimit
{
    public Guid Id { get; set; }
    public string DeviceIdentifier { get; set; } = string.Empty; // Device ID or IP address
    public string PhoneNumber { get; set; } = string.Empty;
    public int AttemptCount { get; set; }
    public DateTime FirstAttemptAt { get; set; }
    public DateTime? BlockedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
