# Mobile-Based Order Creation Implementation

## Overview
This implementation adds support for creating orders with sellers identified by their mobile phone numbers, addressing the error "Mobile-based seller requests not supported yet."

## Features Implemented

### 1. User Lookup Service
- **Interface**: `IUserLookupService` in Application layer
- **Implementation**: `UserLookupService` in Infrastructure layer
- **Methods**:
  - `GetUserByPhoneNumberAsync(string phoneNumber)` - Find user by mobile number
  - `GetUserByEmailAsync(string email)` - Find user by email
  - `GetUserByIdAsync(Guid userId)` - Find user by ID
  - `PhoneNumberExistsAsync(string phoneNumber)` - Check if mobile number exists
  - `EmailExistsAsync(string email)` - Check if email exists

### 2. New Command and Handler
- **Command**: `CreateOrderWithSellerMobileCommand`
- **Validator**: Validates mobile number format and checks if seller exists
- **Handler**: Resolves mobile number to seller ID and creates order with escrow

### 3. API Endpoint
- **Route**: `POST /api/orders/with-seller-mobile`
- **Request Model**: `CreateOrderWithSellerMobileRequest`
- **Features**:
  - Image upload support
  - Mobile number validation
  - Comprehensive error handling
  - Logging for debugging

### 4. Validation Rules
- Mobile number format: `^\+?[1-9]\d{7,15}$` (8-16 digits, optional + prefix)
- Checks if seller exists in the system
- Standard order validation (title, description, amount, currency)

## Usage Example

```http
POST /api/orders/with-seller-mobile
Content-Type: multipart/form-data

{
    "sellerMobileNumber": "+1234567890",
    "title": "iPhone 14 Purchase",
    "description": "Brand new iPhone 14 Pro Max",
    "amount": 999.99,
    "currency": "USD",
    "images": [file1.jpg, file2.jpg]
}
```

## Response
```json
{
    "data": "order-guid-here",
    "isSuccess": true,
    "message": "Order created successfully with seller identified by mobile number."
}
```

## Error Handling
- Returns appropriate error messages for:
  - Invalid mobile number format
  - Seller not found
  - User trying to create order with themselves
  - Standard validation errors

## Architecture Changes
1. Added `IUserLookupService` interface to Application layer
2. Implemented `UserLookupService` in Infrastructure layer
3. Registered service in `DependencyInjection.cs`
4. Created new command/handler following CQRS pattern
5. Added controller endpoint with multipart support
6. Enhanced validation with async user existence checks

## Dependencies
- Uses existing `UserManager<ApplicationUser>` for user lookups
- Integrates with existing escrow and order creation flow
- Follows established patterns for file upload and image handling

## Future Enhancements
- Consider adding phone number normalization (removing spaces, formatting)
- Add support for searching sellers by partial phone numbers
- Implement caching for frequently looked-up phone numbers
- Add analytics for mobile-based order creation usage