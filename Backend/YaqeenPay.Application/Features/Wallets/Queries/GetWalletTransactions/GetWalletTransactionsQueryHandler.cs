using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletTransactions
{
    public class GetWalletTransactionsQueryHandler : IRequestHandler<GetWalletTransactionsQuery, PagedResult<WalletTransactionDto>>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;

        public GetWalletTransactionsQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
        }

        public async Task<PagedResult<WalletTransactionDto>> Handle(GetWalletTransactionsQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId ?? throw new UnauthorizedAccessException("User is not authenticated");
            
            // Get the user's wallet (unified wallet system)
            var wallet = await _walletService.GetWalletByUserIdAsync(userId);
            
            if (wallet == null)
            {
                // Create wallet if it doesn't exist
                wallet = await _walletService.CreateWalletAsync(userId, "PKR");
                
                // Return empty result for new wallet
                return new PagedResult<WalletTransactionDto>(
                    new List<WalletTransactionDto>(), 
                    0, 
                    request.Page, 
                    request.PageSize);
            }

            // Get transaction history with pagination
            var transactions = await _walletService.GetTransactionHistoryAsync(wallet.Id);
            
            // Apply type filtering if specified
            if (!string.IsNullOrEmpty(request.Type) && request.Type != "All")
            {
                transactions = request.Type.ToLower() switch
                {
                    "credit" => transactions.Where(t => 
                        t.Type == TransactionType.Credit || 
                        t.Type == TransactionType.TopUp || 
                        t.Type == TransactionType.Refund).ToList(),
                    "debit" => transactions.Where(t => 
                        t.Type == TransactionType.Debit || 
                        t.Type == TransactionType.Payment || 
                        t.Type == TransactionType.Withdrawal).ToList(),
                    _ => transactions.Where(t => t.Type.ToString().Equals(request.Type, StringComparison.OrdinalIgnoreCase)).ToList()
                };
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(request.SortBy))
            {
                var isDescending = request.SortDir?.ToLower() == "desc";
                
                transactions = request.SortBy.ToLower() switch
                {
                    "date" => isDescending 
                        ? transactions.OrderByDescending(t => t.CreatedAt).ToList()
                        : transactions.OrderBy(t => t.CreatedAt).ToList(),
                    "amount" => isDescending 
                        ? transactions.OrderByDescending(t => t.Amount.Amount).ToList()
                        : transactions.OrderBy(t => t.Amount.Amount).ToList(),
                    "status" => isDescending 
                        ? transactions.OrderByDescending(t => "Completed").ToList()
                        : transactions.OrderBy(t => "Completed").ToList(),
                    _ => transactions.OrderByDescending(t => t.CreatedAt).ToList()
                };
            }
            else
            {
                transactions = transactions.OrderByDescending(t => t.CreatedAt).ToList();
            }

            // Apply pagination
            var totalCount = transactions.Count();
            var skip = (request.Page - 1) * request.PageSize;
            var paginatedTransactions = transactions.Skip(skip).Take(request.PageSize).ToList();

            // Map to DTOs
            var transactionDtos = paginatedTransactions.Select(t => new WalletTransactionDto
            {
                Id = t.Id.ToString(),
                Date = t.CreatedAt,
                CreatedAt = t.CreatedAt,
                Type = MapTransactionTypeToFrontend(t.Type),
                Amount = t.Amount.Amount,
                Status = "Completed", // All persisted transactions are completed
                Description = t.Reason,
                TransactionReference = t.ExternalReference
            }).ToList();

            return new PagedResult<WalletTransactionDto>(
                transactionDtos, 
                totalCount, 
                request.Page, 
                request.PageSize);
        }

        private static string MapTransactionTypeToFrontend(TransactionType type)
        {
            return type switch
            {
                TransactionType.TopUp => "Credit",
                TransactionType.Refund => "Credit",
                TransactionType.Credit => "Credit",
                TransactionType.Payment => "Debit",
                TransactionType.Withdrawal => "Debit",
                TransactionType.Debit => "Debit",
                _ => "Credit"
            };
        }
    }
}