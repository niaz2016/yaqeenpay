# Jazz Cash Payment Integration Documentation

## Overview
This document describes the Jazz Cash payment gateway integration implemented for TechTorio. The integration supports multiple payment methods including Mobile Account, Voucher payments, Direct Pay, and card-based transactions.

## Architecture

### Components
1. **JazzCashPaymentService** - Main service implementing IPaymentGatewayService
2. **JazzCashSettings** - Configuration settings
3. **JazzCashSecureHashHelper** - Utility for generating secure hashes
4. **JazzCashController** - API endpoints for payment operations
5. **DTOs** - Data transfer objects for API communication

### Payment Methods Supported
- **Mobile Account (MWALLET)** - Jazz Cash mobile wallet payments
- **Voucher (OTC)** - Over-the-counter voucher payments  
- **Direct Pay (MPAY)** - Direct card payments
- **3D Secure** - Enhanced security for card transactions

## Configuration

### appsettings.json
```json
{
  "JazzCash": {
    "MerchantId": "Test00127801",
    "Password": "0123456789",
    "IntegritySalt": "your-integrity-salt-from-jazzcash",
    "ApiBaseUrl": "https://sandbox.jazzcash.com.pk",
    "ReturnUrl": "https://yourdomain.com/api/jazzcash/callback",
    "Language": "EN",
    "Currency": "PKR",
    "TransactionExpiryHours": 48,
    "IsSandbox": true
  }
}
```

### Production Configuration
For production, update:
- `MerchantId`: Your actual Jazz Cash merchant ID
- `Password`: Your actual merchant password  
- `IntegritySalt`: Your actual integrity salt from Jazz Cash
- `ApiBaseUrl`: "https://payments.jazzcash.com.pk"
- `IsSandbox`: false

## API Endpoints

### 1. Create Payment Request
```http
POST /api/jazzcash/create-payment
Content-Type: application/json

{
  "amount": 1000.00,
  "customerId": "customer123",
  "callbackUrl": "https://yourapp.com/payment-success"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform?pp_TxnRefNo=T20240925143022",
  "message": "Payment request created successfully"
}
```

### 2. Create Voucher Payment
```http
POST /api/jazzcash/create-voucher-payment
Content-Type: application/json

{
  "amount": 500.00,
  "customerId": "customer123",
  "mobileNumber": "03001234567"
}
```

**Response:**
```json
{
  "success": true,
  "transactionReference": "T20240925143022",
  "message": "Voucher payment request created successfully. Customer will receive SMS with payment details."
}
```

### 3. Payment Callback/Webhook
Jazz Cash will send payment notifications to:
```http
POST /api/jazzcash/callback
```

### 4. Get Transaction Status
```http
GET /api/jazzcash/transaction-status/{transactionId}
```

### 5. Refund Payment
```http
POST /api/jazzcash/refund
Content-Type: application/json

{
  "transactionId": "T20240925143022",
  "amount": 1000.00
}
```

### 6. Void Transaction
```http
POST /api/jazzcash/void
Content-Type: application/json

{
  "transactionId": "T20240925143022"
}
```

## Integration Flow

### Mobile Account Payment Flow
1. Customer initiates payment on your app
2. Your app calls `/api/jazzcash/create-payment`
3. Redirect customer to returned `paymentUrl`
4. Customer completes payment on Jazz Cash portal
5. Jazz Cash sends callback to `/api/jazzcash/callback`
6. Your app processes the callback and updates order status

### Voucher Payment Flow
1. Customer chooses voucher payment option
2. Your app calls `/api/jazzcash/create-voucher-payment` with mobile number
3. Customer receives SMS with payment instructions
4. Customer visits Jazz Cash agent to complete payment
5. Jazz Cash sends callback when payment is completed
6. Your app processes the callback

## Security

### Secure Hash Generation
All Jazz Cash API requests require a secure hash for authentication. The hash is generated using:
- Integrity Salt (provided by Jazz Cash)
- Request parameters in specific order
- SHA256 hashing algorithm

### Signature Verification
All callbacks from Jazz Cash include a secure hash that must be verified to ensure authenticity.

## Error Handling

### Common Response Codes
- `000` - Success
- `001` - Transaction pending
- `121` - Transaction completed
- `124` - Order placed, waiting for payment
- `999` - Transaction failed

### Error Scenarios
1. **Invalid Hash** - Check parameter order and integrity salt
2. **Expired Transaction** - Transaction exceeded expiry time
3. **Insufficient Funds** - Customer doesn't have enough balance
4. **Invalid Card** - Card details incorrect or card blocked

## Testing

### Sandbox Environment
- Base URL: `https://sandbox.jazzcash.com.pk`
- Test Merchant ID: `Test00127801`
- Test Password: `0123456789`

### Test Cards
For Direct Pay testing:
- Visa: `4557012345678902`
- MasterCard: `5123450000000008`
- CVV: `100`
- Expiry: `0525`

### Test Mobile Numbers
For Mobile Account testing:
- `03001234567`
- `03121234567`

## Monitoring and Logging

The integration includes comprehensive logging:
- Payment request creation
- API calls to Jazz Cash
- Callback processing
- Error scenarios
- Security violations

## Best Practices

1. **Always verify signatures** on callbacks
2. **Store transaction references** for reconciliation
3. **Implement idempotency** for payment requests
4. **Set appropriate timeouts** for API calls
5. **Handle network failures** gracefully
6. **Monitor transaction success rates**
7. **Implement retry mechanisms** for failed API calls

## Troubleshooting

### Common Issues

1. **Hash Mismatch Error**
   - Verify parameter order in hash generation
   - Check integrity salt configuration
   - Ensure URL encoding is handled correctly

2. **Transaction Not Found**
   - Check transaction reference format
   - Verify merchant ID configuration
   - Ensure transaction hasn't expired

3. **Callback Not Received**
   - Verify return URL is accessible
   - Check firewall settings
   - Ensure HTTPS is used for production

4. **Amount Mismatch**
   - Jazz Cash expects amounts in paisa (multiply by 100)
   - Ensure proper formatting of decimal amounts

## Support

For technical support:
- Jazz Cash Developer Portal: https://developer.jazzcash.com.pk
- Integration Support: integration@jazzcash.com.pk
- Phone: +92-21-111-124-444

## Changelog

### Version 1.0.0 (2024-09-25)
- Initial Jazz Cash integration
- Mobile Account payment support
- Voucher payment support
- Direct Pay implementation
- Webhook handling
- Transaction status inquiry
- Refund and void operations
- Comprehensive error handling
- Security implementations