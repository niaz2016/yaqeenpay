namespace TechTorio.Application.Common.Models
{
    public class WalletAnalyticsPointDto
    {
        public string Date { get; set; } = string.Empty; // ISO date
        public decimal Balance { get; set; }
        public decimal Credits { get; set; }
        public decimal Debits { get; set; }
    }

    public class WalletAnalyticsDto
    {
        public List<WalletAnalyticsPointDto> Series { get; set; } = new();
        public WalletAnalyticsTotalsDto Totals { get; set; } = new();
    }

    public class WalletAnalyticsTotalsDto
    {
        public decimal Credits30d { get; set; }
        public decimal Debits30d { get; set; }
    }
}