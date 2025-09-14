namespace YaqeenPay.Application.Common.Models
{
    public class WalletBalanceDto
    {
        public Guid WalletId { get; set; }
        public decimal Balance { get; set; }
        public string Currency { get; set; } = string.Empty;
        // Removed Type property as we now use unified wallet system
    }
}