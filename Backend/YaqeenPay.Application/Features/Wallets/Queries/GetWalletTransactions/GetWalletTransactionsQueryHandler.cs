using MediatR;
using YaqeenPay.Application.Common.Interfaces;
using YaqeenPay.Application.Common.Models;
using YaqeenPay.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace YaqeenPay.Application.Features.Wallets.Queries.GetWalletTransactions
{
    public class GetWalletTransactionsQueryHandler : IRequestHandler<GetWalletTransactionsQuery, PagedResult<WalletTransactionDto>>
    {
        private readonly IWalletService _walletService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IApplicationDbContext _context;

        public GetWalletTransactionsQueryHandler(
            IWalletService walletService,
            ICurrentUserService currentUserService,
            IApplicationDbContext context)
        {
            _walletService = walletService;
            _currentUserService = currentUserService;
            _context = context;
        }

        public async Task<PagedResult<WalletTransactionDto>> Handle(GetWalletTransactionsQuery request, CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;
            
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

            // FOR SELLERS: Also include order-related transactions from buyers' wallets 
            // This allows sellers to see frozen amounts and processed payments for their orders
            var orderRelatedTransactions = await GetOrderRelatedTransactionsForSeller(userId, cancellationToken);
            
            // Combine both lists
            var allTransactions = transactions.Concat(orderRelatedTransactions).ToList();
            
            // Apply type filtering if specified
            if (!string.IsNullOrEmpty(request.Type) && request.Type != "All")
            {
                allTransactions = request.Type.ToLower() switch
                {
                    "credit" => allTransactions.Where(t => 
                        t.Type == TransactionType.Credit || 
                        t.Type == TransactionType.TopUp || 
                        t.Type == TransactionType.Refund).ToList(),
                    "debit" => allTransactions.Where(t => 
                        t.Type == TransactionType.Debit || 
                        t.Type == TransactionType.Payment || 
                        t.Type == TransactionType.Withdrawal).ToList(),
                    _ => allTransactions.Where(t => t.Type.ToString().Equals(request.Type, StringComparison.OrdinalIgnoreCase)).ToList()
                };
            }

            // Apply sorting
            if (!string.IsNullOrEmpty(request.SortBy))
            {
                var isDescending = request.SortDir?.ToLower() == "desc";
                
                allTransactions = request.SortBy.ToLower() switch
                {
                    "date" => isDescending 
                        ? allTransactions.OrderByDescending(t => t.CreatedAt).ToList()
                        : allTransactions.OrderBy(t => t.CreatedAt).ToList(),
                    "amount" => isDescending 
                        ? allTransactions.OrderByDescending(t => t.Amount.Amount).ToList()
                        : allTransactions.OrderBy(t => t.Amount.Amount).ToList(),
                    "status" => isDescending 
                        ? allTransactions.OrderByDescending(t => "Completed").ToList()
                        : allTransactions.OrderBy(t => "Completed").ToList(),
                    _ => allTransactions.OrderByDescending(t => t.CreatedAt).ToList()
                };
            }
            else
            {
                allTransactions = allTransactions.OrderByDescending(t => t.CreatedAt).ToList();
            }

            // Apply pagination
            var totalCount = allTransactions.Count();
            var skip = (request.Page - 1) * request.PageSize;
            var paginatedTransactions = allTransactions.Skip(skip).Take(request.PageSize).ToList();

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
                TransactionType.Freeze => "Debit", // Frozen amounts show as debits for sellers
                TransactionType.Unfreeze => "Credit",
                TransactionType.FrozenToDebit => "Debit",
                _ => "Credit"
            };
        }

        /// <summary>
        /// Gets order-related transactions for a seller (frozen amounts and processed payments)
        /// This allows sellers to see transactions related to their orders even if they're in buyers' wallets
        /// </summary>
        private async Task<IEnumerable<Domain.Entities.WalletTransaction>> GetOrderRelatedTransactionsForSeller(
            Guid sellerId, 
            CancellationToken cancellationToken)
        {
            // Get all orders where this user is the seller
            var sellerOrderIds = await _context.Orders
                .Where(o => o.SellerId == sellerId)
                .Select(o => o.Id)
                .ToListAsync(cancellationToken);

            if (!sellerOrderIds.Any())
            {
                return new List<Domain.Entities.WalletTransaction>();
            }

            // Create a list to collect seller-friendly representations
            var sellerTransactions = new List<Domain.Entities.WalletTransaction>();

            // For each seller order, find buyer-side transactions that reference it
            foreach (var orderId in sellerOrderIds)
            {
                var orderIdString = orderId.ToString();

                // Find frozen transactions (when buyers pay): "Payment for order {orderId}"
                // These are Freeze transactions in buyer wallets - show as "Payment received for order" for sellers
                var frozenTxns = await _context.WalletTransactions
                    .Where(t => t.Type == TransactionType.Freeze && 
                               t.Reason.Contains(orderIdString))
                    .ToListAsync(cancellationToken);

                // Create seller-friendly representations for frozen transactions
                foreach (var buyerTxn in frozenTxns)
                {
                    // Debug: Log the buyer transaction amount
                    Console.WriteLine($"Creating seller transaction for order {orderIdString}: BuyerAmount={buyerTxn.Amount.Amount}, Currency={buyerTxn.Amount.Currency}");
                    
                    // Create a seller-friendly transaction showing payment received
                    var sellerTxn = new Domain.Entities.WalletTransaction(
                        Guid.Empty, // Seller doesn't need wallet ID for this view
                        TransactionType.Credit, // Show as credit for seller (they're receiving payment)
                        buyerTxn.Amount, // Use the buyer's payment amount
                        $"Payment received for order {orderIdString}", // Seller-friendly description
                        buyerTxn.ReferenceId, // Reference to the order
                        buyerTxn.ReferenceType,
                        buyerTxn.ExternalReference
                    );
                    
                    // Use reflection to set CreatedAt to match the buyer transaction date
                    var createdAtProperty = typeof(Domain.Entities.WalletTransaction).GetProperty("CreatedAt");
                    createdAtProperty?.SetValue(sellerTxn, buyerTxn.CreatedAt);

                    sellerTransactions.Add(sellerTxn);
                }

                // Find processed transactions (when orders complete): "Payment completed for order {orderId}"  
                // These are Debit transactions in buyer wallets - show as completed for sellers
                var processedTxns = await _context.WalletTransactions
                    .Where(t => t.Type == TransactionType.Debit && 
                               t.Reason.Contains($"Payment completed for order {orderIdString}"))
                    .ToListAsync(cancellationToken);

                // Create seller-friendly representations for processed transactions
                foreach (var buyerTxn in processedTxns)
                {
                    // Create a seller-friendly transaction showing payment completion
                    var sellerTxn = new Domain.Entities.WalletTransaction(
                        Guid.Empty, // Seller doesn't need wallet ID for this view  
                        TransactionType.Debit, // Show as debit for seller (payment processed/released)
                        buyerTxn.Amount, // Use the buyer's payment amount
                        $"Payment completed for order {orderIdString}", // Seller-friendly description
                        buyerTxn.ReferenceId, // Reference to the order
                        buyerTxn.ReferenceType,
                        buyerTxn.ExternalReference
                    );
                    
                    // Use reflection to set CreatedAt to match the buyer transaction date
                    var createdAtProperty = typeof(Domain.Entities.WalletTransaction).GetProperty("CreatedAt");
                    createdAtProperty?.SetValue(sellerTxn, buyerTxn.CreatedAt);

                    sellerTransactions.Add(sellerTxn);
                }
            }

            return sellerTransactions.OrderByDescending(t => t.CreatedAt);
        }
    }
}