namespace YaqeenPay.Application.Features.Admin.Queries.GetAdminStats;

public class AdminStatsResponse
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int PendingKycDocuments { get; set; }
    public int PendingSellers { get; set; }
    public int ActiveOrders { get; set; }
    public int OpenDisputes { get; set; }
    public decimal TotalTransactionVolume { get; set; }
    public double MonthlyGrowthRate { get; set; }
    public decimal TotalWalletBalance { get; set; }
}