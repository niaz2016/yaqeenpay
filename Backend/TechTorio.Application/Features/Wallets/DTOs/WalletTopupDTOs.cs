namespace TechTorio.Application.Features.Wallets.DTOs
{
    public class WalletTopupRequest
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "PKR";
        public string PaymentMethod { get; set; } = "QR";
    }

    public class WalletTopupResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        // Final amount assigned for this lock (may be +N PKR to disambiguate)
        public decimal EffectiveAmount { get; set; }
        // For backward compatibility with existing UI
        public decimal SuggestedAmount { get; set; }
        public string? QrImageUrl { get; set; }
        // New: raw Raast/EMV QR payload (TLV string) containing IBAN, amount, expiry
        public string? QrPayload { get; set; }
        public string? TransactionReference { get; set; }
        public decimal CurrentBalance { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class QrPaymentVerificationRequest
    {
        public string TransactionReference { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class WalletBalanceResponse
    {
        public decimal Balance { get; set; }
        public string Currency { get; set; } = "PKR";
    }
}