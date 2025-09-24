# Mobile-Based Order Creation System

## Overview
The order creation system has been modified so that sellers or buyers can create orders for specific users by entering their mobile number as a unique identifier. This replaces the previous system that used seller GUIDs.

## Frontend Changes Completed

### 1. Updated Order Types (`src/types/order.ts`)
- Added `targetUserMobile` field to `CreateOrderPayload` (required)
- Added `creatorRole` field to identify who created the order ('buyer' | 'seller')
- Added `targetUserMobile` and `creatorRole` fields to `Order` interface
- Made `sellerId` optional in `CreateOrderPayload` since we now use mobile numbers

### 2. Modified Order Creation Form (`src/components/orders/OrderCreateStepper.tsx`)
- Replaced "Seller" step with "Target User" step
- Removed `SellerBrowser` component dependency
- Added mobile number input field for target user identification
- Updated validation logic to require mobile number instead of seller selection
- Updated confirmation step to show target user mobile instead of seller business name
- Modified order creation payload to include `targetUserMobile` and `creatorRole`

### 3. Updated Order Services (`src/services/ordersService.ts`)
- Modified `createWithImages()` to accept `targetUserMobile` instead of `sellerId`
- Added `creatorRole` parameter to `createWithImages()`
- Modified `createSellerRequest()` to accept optional `targetUserMobile`
- **NEW**: Added `getBuyerOrders()` method to call `/orders/buyer` endpoint
- **NEW**: Added `getSellerOrdersPaginated()` method to call `/orders/seller` endpoint
- **NEW**: Added `getAllUserOrders()` method that combines both buyer and seller orders as fallback

### 4. Updated Order Creation Page (`src/pages/orders/NewOrderPage.tsx`)
- Updated seller request creation to include `targetUserMobile`
- Modified buyer order creation to use `targetUserMobile` instead of `sellerId`
- Updated notification logic to use mobile numbers
- Improved success messages to show target user mobile
- Removed GUID validation since we no longer use seller IDs

### 5. Enhanced Order List Page (`src/pages/orders/OrderListPage.tsx`)
- **NEW**: Now uses `getAllUserOrders()` method to ensure all orders are visible
- **NEW**: Added user role indicator (buyer/seller badge) for each order
- **NEW**: Dynamic display of counterparty (shows seller when user is buyer, vice versa)
- Improved order visibility by combining buyer and seller order endpoints as fallback

## Backend Changes Required

The backend needs to be updated to support mobile-based order creation:

### 1. Order Creation Commands
- Update `CreateOrderCommand` to accept `TargetUserMobile` instead of `SellerId`
- Add user lookup by mobile number to resolve user IDs
- Update validation logic to verify mobile number exists
- Modify order assignment logic to set proper buyer/seller based on creator role

### 2. API Endpoints
- Update `/orders/with-images` endpoint to handle `TargetUserMobile` parameter
- Update `/orders/seller-request` endpoint to handle `TargetUserMobile` parameter
- Update validation to ensure target user exists and is active

### 3. Database Updates (if needed)
- Consider adding `CreatorRole` and `TargetUserMobile` fields to Order entity for audit trail
- Ensure existing queries work with the new mobile-based system

### 4. Notification Updates
- Update notification service to work with mobile numbers instead of user IDs
- Ensure notifications are sent to the correct target user

## How Order Visibility Now Works

### Frontend Implementation
The `/orders` page now uses a robust approach to ensure all orders are visible:

1. **Primary Method**: Calls the main `/orders` endpoint which should show orders where user is buyer OR seller
2. **Fallback Method**: If the main endpoint fails, it calls both `/orders/buyer` and `/orders/seller` endpoints and combines the results
3. **Deduplication**: Removes any duplicate orders by ID
4. **Visual Indicators**: Shows whether user is "buyer" or "seller" for each order
5. **Dynamic Labels**: Shows appropriate counterparty information

### Expected Behavior
When a seller creates an order for a buyer (using mobile number):
- The order should appear in the seller's order list (as seller)
- The order should appear in the buyer's order list (as buyer) ← **This is the fix**
- Both users can view and manage the order

### Current Status
✅ Frontend is ready and will show orders correctly once backend properly handles mobile-to-user resolution
⏳ Backend needs to resolve mobile numbers to user IDs during order creation

## User Experience Improvements

### For Buyers:
- Can now create orders for any seller by entering their mobile number
- No longer need to browse through seller listings
- Direct targeting of specific sellers

### For Sellers:
- Can create product listings for specific buyers by mobile number
- Direct targeting of known customers
- Better control over who sees their listings

## Testing Checklist

1. ✅ Frontend compiles successfully
2. ✅ Order creation form shows mobile input field
3. ✅ Form validation requires mobile number input
4. ✅ Order creation payloads include target mobile number
5. ⏳ Backend integration (requires backend updates)
6. ⏳ End-to-end order creation testing
7. ⏳ Order visibility testing (both parties can see orders)
8. ⏳ Notification testing

## Next Steps

1. Update backend order creation commands and handlers
2. Update API endpoint validations
3. Test mobile number lookup functionality
4. Verify order assignment logic
5. Test notifications with mobile numbers
6. Perform end-to-end testing