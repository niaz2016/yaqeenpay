using TechTorio.Domain.Enums;

namespace TechTorio.Application.Common.Models
{
    public class WalletSummaryDto
    {
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "PKR";
        public string Status { get; set; } = "Active"; // Active, Suspended, Pending
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}