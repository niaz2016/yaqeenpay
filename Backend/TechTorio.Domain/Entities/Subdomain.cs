using TechTorio.Domain.Common;

namespace TechTorio.Domain.Entities;

public class Subdomain : AuditableEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Active, Suspended
    public string? ApplicantEmail { get; set; }
    public string? ApplicantName { get; set; }
    public string? Purpose { get; set; }
    public string? ContactPhone { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
    public string? RejectionReason { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}
