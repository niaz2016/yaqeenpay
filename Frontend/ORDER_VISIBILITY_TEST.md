# Testing Mobile-Based Order Creation System

## Test Scenario: Seller Creates Order for Buyer

### Prerequisites
1. Seller account (User A) with mobile: +92XXXXXXXXX1
2. Buyer account (User B) with mobile: +92XXXXXXXXX2
3. Both users logged into the system

### Test Steps

#### Step 1: Seller Creates Order for Specific Buyer
1. Log in as Seller (User A)
2. Navigate to `/orders/new`
3. Select "Seller" role in step 1
4. In step 2 "Target User", enter Buyer's mobile: `+92XXXXXXXXX2`
5. Fill in order details (amount, description, items)
6. Complete wallet validation (if applicable)
7. Submit order creation

**Expected Result**: Order created successfully with success message showing buyer's mobile number

#### Step 2: Verify Order Appears in Seller's List
1. Navigate to `/orders`
2. Look for the created order

**Expected Result**: 
- Order appears in the list
- Shows "seller" badge next to order ID
- Shows "Buyer: [buyer's user ID]" in the description

#### Step 3: Verify Order Appears in Buyer's List
1. Log out and log in as Buyer (User B)
2. Navigate to `/orders`
3. Look for the order created by the seller

**Expected Result**: 
- Order appears in the buyer's list ← **This is the main fix**
- Shows "buyer" badge next to order ID
- Shows "Seller: [seller's username]" in the description

### Current Implementation Status

✅ **Frontend Ready**:
- Order creation form accepts mobile numbers
- Order list page shows orders from both buyer and seller perspectives
- Visual indicators show user's role in each order
- Fallback mechanism combines buyer and seller endpoints

⏳ **Backend Required**:
- Mobile number to user ID resolution during order creation
- Proper buyer/seller assignment based on creator role and target mobile

### API Endpoints Being Used

1. **Order Creation**:
   - `POST /orders/seller-request` (for seller-created orders)
   - `POST /orders/with-images` (for orders with images)
   - `POST /orders` (fallback for orders without images)

2. **Order Listing**:
   - `GET /orders` (primary - should show both buyer and seller orders)
   - `GET /orders/buyer` (fallback - buyer-specific orders)
   - `GET /orders/seller` (fallback - seller-specific orders)

### Debug Information

The frontend now includes debug information in the order list:
- Each order shows whether the current user is the "buyer" or "seller"
- Orders display appropriate counterparty information
- Console logs show which API endpoints are being called

### Success Criteria

✅ Order creation form works with mobile numbers
✅ Orders are created with targetUserMobile parameter
✅ Order list shows role indicators
✅ Fallback mechanism ensures order visibility
⏳ Backend resolves mobile to user ID (pending backend update)
⏳ Orders appear in target user's list (pending backend update)