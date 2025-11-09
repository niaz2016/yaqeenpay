using MediatR;
using TechTorio.Application.Common.Interfaces;
using TechTorio.Application.Common.Models;
using TechTorio.Domain.Enums;

namespace TechTorio.Application.Features.Wallets.Queries.GetWalletAnalytics
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
            var endDate = DateTime.UtcNow;
            var startDate = request.Days == 1 
                ? endDate.Date // For 1 day, start from midnight today
                : endDate.Date.AddDays(-request.Days);
            
            var transactions = await _walletService.GetTransactionHistoryAsync(
                wallet.Id, 
                startDate, 
                endDate); // Use current time for end

            // Sort transactions chronologically to calculate running balance forward
            var sortedTransactions = transactions.OrderBy(t => t.CreatedAt).ToList();
            
            // Calculate starting balance (current balance minus all transactions in period)
            var currentBalance = wallet.Balance.Amount;
            var netChangeInPeriod = sortedTransactions
                .Sum(t => {
                    if (t.Type == TransactionType.Credit || t.Type == TransactionType.TopUp || t.Type == TransactionType.Refund)
                        return t.Amount.Amount;
                    else if (t.Type == TransactionType.Debit || t.Type == TransactionType.Payment || t.Type == TransactionType.Withdrawal)
                        return -t.Amount.Amount;
                    return 0m;
                });
            
            var startingBalance = currentBalance - netChangeInPeriod;
            var runningBalance = startingBalance;
            
            var seriesData = new List<WalletAnalyticsPointDto>();
            
            // For 1 day (24 hours), generate hourly points
            if (request.Days == 1)
            {
                var today = DateTime.UtcNow.Date;
                
                for (int hour = 0; hour < 24; hour++)
                {
                    var hourStart = today.AddHours(hour);
                    var hourEnd = hourStart.AddHours(1).AddTicks(-1);
                    
                    var hourTransactions = sortedTransactions
                        .Where(t => t.CreatedAt >= hourStart && t.CreatedAt <= hourEnd)
                        .ToList();
                    
                    var credits = hourTransactions
                        .Where(t => t.Type == TransactionType.Credit || t.Type == TransactionType.TopUp || t.Type == TransactionType.Refund)
                        .Sum(t => t.Amount.Amount);
                        
                    var debits = hourTransactions
                        .Where(t => t.Type == TransactionType.Debit || t.Type == TransactionType.Payment || t.Type == TransactionType.Withdrawal)
                        .Sum(t => t.Amount.Amount);

                    runningBalance += credits - debits;
                    
                    seriesData.Add(new WalletAnalyticsPointDto
                    {
                        Date = hourStart.ToString("yyyy-MM-ddTHH:mm:ss"),
                        Balance = runningBalance,
                        Credits = credits,
                        Debits = debits
                    });
                }
            }
            else
            {
                // Daily aggregation for periods > 1 day
                for (int i = request.Days - 1; i >= 0; i--)
                {
                    var currentDate = endDate.Date.AddDays(-i);
                    var dayStart = currentDate.Date;
                    var dayEnd = dayStart.AddDays(1).AddTicks(-1);
                    
                    var dayTransactions = sortedTransactions
                        .Where(t => t.CreatedAt >= dayStart && t.CreatedAt <= dayEnd)
                        .ToList();
                    
                    var credits = dayTransactions
                        .Where(t => t.Type == TransactionType.Credit || t.Type == TransactionType.TopUp || t.Type == TransactionType.Refund)
                        .Sum(t => t.Amount.Amount);
                        
                    var debits = dayTransactions
                        .Where(t => t.Type == TransactionType.Debit || t.Type == TransactionType.Payment || t.Type == TransactionType.Withdrawal)
                        .Sum(t => t.Amount.Amount);

                    runningBalance += credits - debits;
                    
                    seriesData.Add(new WalletAnalyticsPointDto
                    {
                        Date = currentDate.ToString("yyyy-MM-dd"),
                        Balance = runningBalance,
                        Credits = credits,
                        Debits = debits
                    });
                }
            }

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