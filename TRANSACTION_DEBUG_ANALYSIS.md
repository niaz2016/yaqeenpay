# Debug Transaction Visibility Issue

## Current Issue Analysis
Based on the screenshot, the seller is seeing:
- ✅ Credit transactions (topups): Correct amounts shown
- ❌ "Payment received" transactions: PKR 0.00 amounts  
- ❌ Frozen amount summary: PKR 0.00 (should show pending payments)
- ❌ Processed amount summary: PKR 0.00 (should show completed payments)

## Root Cause Identified
1. **"Payment received" transactions with PKR 0.00**: This indicates `order.FrozenAmount` is null when `ConfirmDelivery` is called
2. **Frozen/Processed summaries showing PKR 0.00**: Sellers don't see buyer-side frozen transactions

## Fixes Applied

### Fix 1: Null Check in ConfirmDelivery
```csharp
// Added null check for order.FrozenAmount in ConfirmDeliveryCommand.cs
if (transferAmount == null)
{
    throw new InvalidOperationException($"Order {order.Id} has no frozen amount set. Cannot complete delivery.");
}
```

### Fix 2: Cross-Wallet Transaction Visibility
```csharp
// Modified GetWalletTransactionsQueryHandler to include buyer-side transactions for sellers
private async Task<IEnumerable<Domain.Entities.WalletTransaction>> GetOrderRelatedTransactionsForSeller(...)
{
    // Finds TransactionType.Freeze (when buyers pay) 
    // Finds TransactionType.Debit with "Payment completed" (when orders complete)
}
```

## Testing Required

### Test Scenario 1: New Orders
1. Buyer pays for seller's order
2. Check seller wallet shows frozen amount > 0
3. Confirm delivery 
4. Check seller gets correct payment amount

### Test Scenario 2: Existing Orders
1. Check if existing orders have FrozenAmount set
2. If null, may need data migration

## Next Steps
1. Test the backend changes
2. Verify seller can see frozen amounts from buyer payments
3. Verify "Payment received" transactions show correct amounts
4. Check if existing orders need FrozenAmount populated