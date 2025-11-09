namespace TechTorio.Domain.Entities;

public class ApiRateLimit
{
    public Guid Id { get; set; }
    public string Identifier { get; set; } = string.Empty; // IP address or fingerprint
    public string Endpoint { get; set; } = string.Empty; // e.g., "/api/auth/login"
    public int RequestCount { get; set; }
    public DateTime WindowStart { get; set; }
    public DateTime? BlockedUntil { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
