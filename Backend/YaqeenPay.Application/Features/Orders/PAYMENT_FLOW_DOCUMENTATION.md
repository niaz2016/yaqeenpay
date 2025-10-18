# Order Payment & Escrow Flow Documentation

## Overview
This document explains the complete payment and escrow flow for orders in the YaqeenPay system. The flow is designed to protect both buyers and sellers by holding funds in escrow until delivery is confirmed.

## The Three-Stage Flow

### Stage 1: Payment (`POST /orders/{orderId}/pay`)
**Handler:** `PayForOrderCommandHandler`  
**Who can trigger:** Buyer only  
**Order Status:** `Created` or `PaymentPending` ? `AwaitingShipment`

#### What happens:
1. **Validates** buyer has sufficient available balance
2. **Freezes funds** in buyer's wallet:
   - Calls `wallet.FreezeAmount(order.Amount, ...)`
   - This moves funds from `available balance` to `frozen balance`
   - Total balance remains unchanged (funds are locked, not deducted yet)
3. **Updates order** with frozen amount:
   - Sets `order.IsAmountFrozen = true`
   - Sets `order.FrozenAmount = order.Amount`
   - Sets `order.PaymentDate = DateTime.UtcNow`
   - Changes status to `AwaitingShipment`

#### Wallet State After Payment:
```
Buyer Wallet:
- Total Balance: 1000 PKR (unchanged)
- Available Balance: 500 PKR (reduced by order amount)
- Frozen Balance: 500 PKR (increased by order amount)

Seller Wallet:
- No changes yet
```

---

### Stage 2: Shipment (`POST /orders/{orderId}/ship`)
**Handler:** `MarkOrderAsShippedCommandHandler`  
**Who can trigger:** Seller only  
**Order Status:** `AwaitingShipment` ? `Shipped`

#### What happens:
1. **Validates** order is in `AwaitingShipment` status
2. **Marks order as shipped**:
   - Calls `order.MarkAsShipped()`
   - Sets `order.ShippedDate = DateTime.UtcNow`
   - Changes status to `Shipped`
3. **No wallet operations** - funds remain frozen in buyer's wallet

#### Wallet State After Shipment:
```
Buyer Wallet:
- Total Balance: 1000 PKR (unchanged)
- Available Balance: 500 PKR (unchanged)
- Frozen Balance: 500 PKR (unchanged - still frozen)

Seller Wallet:
- No changes yet
```

---

### Stage 3: Delivery Confirmation (`POST /orders/{orderId}/confirm-delivery`)
**Handler:** `ConfirmDeliveryCommandHandler`  
**Who can trigger:** Buyer only  
**Order Status:** `Shipped` or `DeliveredPendingDecision` ? `Completed`

#### What happens:
1. **Validates** order has frozen funds from payment
2. **Transfers frozen funds**:
   - **Step 1:** Calls `buyerWallet.TransferFrozenToDebit(transferAmount, ...)`
     - This reduces both `frozen balance` AND `total balance`
     - Records a `FrozenToDebit` transaction
   - **Step 2:** Calls `sellerWallet.Credit(transferAmount, ...)`
     - This increases seller's `total balance` and `available balance`
     - Records a `Credit` transaction
3. **Completes order**:
   - Calls `order.CompleteOrder()`
   - Sets `order.IsAmountFrozen = false`
   - Sets `order.CompletedDate = DateTime.UtcNow`
   - Changes status to `Completed`

#### Wallet State After Delivery Confirmation:
```
Buyer Wallet:
- Total Balance: 500 PKR (reduced by order amount)
- Available Balance: 500 PKR (unchanged)
- Frozen Balance: 0 PKR (unfrozen and deducted)

Seller Wallet:
- Total Balance: 1500 PKR (increased by order amount)
- Available Balance: 1500 PKR (increased by order amount)
- Frozen Balance: 0 PKR (unchanged)
```

---

## Important Notes

### ? Common Misconceptions
1. **"Funds are frozen twice"** - FALSE
   - Funds are ONLY frozen once during payment (Stage 1)
   - Delivery confirmation (Stage 3) transfers already-frozen funds
   - No additional freeze operation occurs during delivery

2. **"Funds are deducted immediately on payment"** - FALSE
   - On payment, funds are frozen but not deducted
   - Total balance remains the same, only available balance decreases
   - Actual deduction happens on delivery confirmation

3. **"Seller gets paid when order is shipped"** - FALSE
   - Shipment only updates order status
   - No wallet operations occur during shipment
   - Seller is paid only when buyer confirms delivery

### ? Key Design Principles
1. **Buyer Protection**: Funds are held in escrow until delivery is confirmed
2. **Seller Protection**: Once buyer confirms delivery, funds are transferred immediately
3. **Transparency**: All wallet operations are recorded as transactions
4. **Atomicity**: Each stage is a single database transaction (all-or-nothing)

---

## Transaction Types Used

| Transaction Type | When | Direction | Purpose |
|-----------------|------|-----------|---------|
| `Freeze` | Payment (Stage 1) | Buyer wallet | Lock funds in escrow |
| `FrozenToDebit` | Delivery Confirmation (Stage 3) | Buyer wallet | Remove frozen funds |
| `Credit` | Delivery Confirmation (Stage 3) | Seller wallet | Add funds to seller |

---

## Error Scenarios

### Payment Fails
- **Insufficient funds**: Error returned, order remains in `Created` status
- **Already paid**: Error if order is not in `Created` or `PaymentPending` status

### Delivery Confirmation Fails
- **No frozen funds**: Error if `order.IsAmountFrozen == false` or `order.FrozenAmount == null`
- **Insufficient frozen balance**: Error if buyer's frozen balance < order amount
- **Wrong status**: Error if order is not in `Shipped` or `DeliveredPendingDecision` status

---

## Code References

- **Payment Handler**: `YaqeenPay.Application/Features/Orders/Commands/PayForOrder/PayForOrderCommand.cs`
- **Shipment Handler**: `YaqeenPay.Application/Features/Orders/Commands/MarkOrderAsShipped/MarkOrderAsShippedCommand.cs`
- **Delivery Confirmation Handler**: `YaqeenPay.Application/Features/Orders/Commands/ConfirmDelivery/ConfirmDeliveryCommand.cs`
- **Wallet Entity**: `YaqeenPay.Domain/Entities/Wallet.cs`
- **Order Entity**: `YaqeenPay.Domain/Entities/Order.cs`

---

## Testing Checklist

To verify the flow is working correctly:

1. ? Create an order
2. ? Buyer pays ? Check buyer's frozen balance increases
3. ? Verify buyer's total balance is unchanged
4. ? Seller ships ? Check no wallet changes occur
5. ? Buyer confirms delivery ? Check:
   - Buyer's frozen balance decreases to 0
   - Buyer's total balance decreases by order amount
   - Seller's available balance increases by order amount
   - Order status is `Completed`
6. ? Verify transaction history shows: Freeze ? FrozenToDebit (buyer), Credit (seller)

---

Last Updated: 2024
