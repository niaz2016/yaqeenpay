# Order Visibility Bug Fix

## Problem Description
Orders weren't properly visible to buyers when they were created. The main issue was that **seller requests** (where `BuyerId == SellerId`) were polluting the regular order queries, making it difficult for users to see their actual orders.

## Root Cause
The order query handlers were including **seller requests** in the regular order lists. Seller requests are temporary orders where both buyer and seller IDs are set to the seller's ID until a real buyer accepts the request.

### Issues Identified:

1. **Main Orders List** (`GetOrdersListQuery`): 
   - Was including seller requests in the combined buyer/seller order view
   - Users saw orders where `BuyerId == SellerId` mixed with real orders

2. **Buyer Orders** (`GetBuyerOrdersQuery`):
   - Could potentially show seller requests if user was both buyer and seller  
   - Not properly filtering out seller requests

3. **Seller Orders** (`GetSellerOrdersQuery`):
   - Could show seller requests mixed with real orders where user is the seller
   - Confusing distinction between "requests" and "actual orders"

## Solution Implemented

### 1. Updated Main Orders List Query
**File**: `GetOrdersListQuery.cs`

```csharp
// Before
query = query.Where(o => o.BuyerId == userId || o.SellerId == userId);

// After - exclude seller requests
query = query.Where(o => (o.BuyerId == userId || o.SellerId == userId) && o.BuyerId != o.SellerId);
```

### 2. Updated Buyer Orders Query  
**File**: `GetBuyerOrdersQuery.cs`

```csharp
// Before
.Where(o => o.BuyerId == userId)

// After - exclude seller requests
.Where(o => o.BuyerId == userId && o.BuyerId != o.SellerId)
```

### 3. Updated Seller Orders Query
**File**: `GetSellerOrdersQuery.cs`

```csharp
// Before  
.Where(o => o.SellerId == userId)

// After - exclude seller requests
.Where(o => o.SellerId == userId && o.BuyerId != o.SellerId)
```

## Result

### ✅ Fixed Behavior
- **Regular Orders List**: Only shows actual orders where user is buyer OR seller (excludes seller requests)
- **Buyer Orders**: Only shows orders where user is the actual buyer 
- **Seller Orders**: Only shows orders where user is the actual seller
- **Seller Requests**: Handled separately via `GetAvailableSellerRequestsQuery`

### 🔍 Order Flow Clarity
1. **Seller creates request** → Stored as seller request (`BuyerId == SellerId`)
2. **Buyers browse available requests** → Separate endpoint `/available-seller-requests`  
3. **Buyer accepts request** → Creates real order with distinct buyer/seller IDs
4. **Real order appears** → Visible in both buyer's and seller's order lists
5. **Original seller request** → Cancelled/hidden from available requests

## Files Modified
- `Backend/YaqeenPay.Application/Features/Orders/Queries/GetOrdersList/GetOrdersListQuery.cs`
- `Backend/YaqeenPay.Application/Features/Orders/Queries/GetBuyerOrders/GetBuyerOrdersQuery.cs`
- `Backend/YaqeenPay.Application/Features/Orders/Queries/GetSellerOrders/GetSellerOrdersQuery.cs`

## Impact
- ✅ Buyers can now see orders created for them
- ✅ Sellers can see orders where they are the actual seller  
- ✅ Clean separation between product listings (seller requests) and actual orders
- ✅ No more confusion with duplicate/phantom orders
- ✅ Proper order visibility for both buyer and seller sides

## Testing
1. **Seller creates seller request** → Should NOT appear in regular orders list
2. **Buyer accepts seller request** → New order should appear in BOTH buyer's and seller's order lists
3. **Direct order creation** → Should appear properly in both parties' lists
4. **Available seller requests** → Should be accessible via separate endpoint

The fix ensures that users only see their actual orders, while seller requests are properly segregated for discovery and acceptance workflows.