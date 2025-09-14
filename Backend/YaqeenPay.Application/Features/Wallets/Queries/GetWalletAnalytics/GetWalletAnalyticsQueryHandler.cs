using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletAnalytics
{
    public class GetWalletAnalyticsQueryHandler : IRequestHandler<GetWalletAnalyticsQuery, WalletAnalyticsDto>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public GetWalletAnalyticsQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<WalletAnalyticsDto> Handle(GetWalletAnalyticsQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            
            // Get the user's wallet (unified system)
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            
            if (wallet == null)
            {
                // Create wallet if it doesn't exist
                wallet = await _walletService.CreateWalletAsync(userId, "PKR");
                
                // Return empty analytics for new wallet
                return new WalletAnalyticsDto
                {
                    Series = new List<WalletAnalyticsPointDto>(),
                    Totals = new WalletAnalyticsTotalsDto
                    {
                        Credits30d = 0,
                        Debits30d = 0
                    }
                };
            }

            // Get transaction history for analytics
            var endDate = DateTime.UtcNow.Date;
            var startDate = endDate.AddDays(-request.Days);
            
            var transactions = await _walletService.GetTransactionHistoryAsync(
                wallet.Id, 
                startDate, 
                endDate.AddDays(1).AddTicks(-1)); // End of day

            // Group transactions by date
            var seriesData = new List<WalletAnalyticsPointDto>();
            var runningBalance = wallet.Balance.Amount;
            
            // Calculate analytics for each day
            for (int i = 0; i < request.Days; i++)
            {
                var currentDate = endDate.AddDays(-i);
                var dayTransactions = transactions.Where(t => t.CreatedAt.Date == currentDate).ToList();
                
                var credits = dayTransactions
                    .Where(t => t.Type == TransactionType.Credit || t.Type == TransactionType.TopUp || t.Type == TransactionType.Refund)
                    .Sum(t => t.Amount.Amount);
                    
                var debits = dayTransactions
                    .Where(t => t.Type == TransactionType.Debit || t.Type == TransactionType.Payment || t.Type == TransactionType.Withdrawal)
                    .Sum(t => t.Amount.Amount);

                // For running balance calculation, we'd need to calculate backwards from current balance
                // For now, we'll use current balance for the latest day and estimate for previous days
                var dayBalance = i == 0 ? runningBalance : Math.Max(0, runningBalance - (credits - debits));
                
                seriesData.Add(new WalletAnalyticsPointDto
                {
                    Date = currentDate.ToString("yyyy-MM-dd"),
                    Balance = dayBalance,
                    Credits = credits,
                    Debits = debits
                });
            }

            // Reverse to get chronological order
            seriesData.Reverse();

            // Calculate totals
            var totalCredits = seriesData.Sum(s => s.Credits);
            var totalDebits = seriesData.Sum(s => s.Debits);

            return new WalletAnalyticsDto
            {
                Series = seriesData,
                Totals = new WalletAnalyticsTotalsDto
                {
                    Credits30d = totalCredits,
                    Debits30d = totalDebits
                }
            };
        }
    }
}