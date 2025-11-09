namespace TechTorio.Application.Common.Models
{
    public class WalletTransactionDto
    {
        public string Id { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Type { get; set; } = string.Empty; // Credit, Debit
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty; // Completed, Pending, Failed
        public string? Description { get; set; }
        public string? TransactionReference { get; set; }
    }
}