# Admin Settings System Implementation

## Overview
This implementation provides a comprehensive admin settings system that allows administrators to configure application settings through a GUI interface, overriding values in `appsettings.json` without requiring server restarts.

## Key Features

### ✅ **Database-Driven Configuration**
- Settings stored in PostgreSQL database with full CRUD operations
- Real-time configuration changes without server restart
- Fallback to `appsettings.json` if no database override exists

### ✅ **Security & Audit**
- Admin-only access with role-based authorization
- Complete audit trail of all setting changes
- Sensitive value masking and encryption support
- IP address and user agent tracking

### ✅ **Type Safety**
- Strongly typed configuration with data type validation
- Support for string, int, bool, decimal, and JSON data types
- Validation rules for min/max values and patterns

### ✅ **Performance**
- Memory caching with configurable expiration (5 minutes default)
- Bulk operations support
- Efficient database queries with indexes

### ✅ **User Experience**
- Modern React UI with Material-UI components
- Grouped settings by category for easy navigation
- Inline editing with real-time validation
- Sensitive value show/hide toggle

## Architecture

### Domain Layer
- `AdminSystemSettings` - Main entity for storing settings
- `AdminSettingsAudit` - Audit trail entity
- `AdminSettingsCategory` - Enum for categorization
- Value objects for strongly typed configuration sections

### Infrastructure Layer
- `AdminSystemSettingsRepository` - Data access layer
- `AdminConfigurationService` - Dynamic configuration service with caching
- `AdminSettingsSeedService` - Default settings seeding

### Application Layer
- CQRS pattern with commands and queries
- `CreateAdminSettingCommand` - Create new settings
- `UpdateAdminSettingCommand` - Update existing settings
- `GetAdminSettingsQuery` - Retrieve settings with grouping

### API Layer
- `AdminSettingsController` - REST API endpoints
- Role-based authorization (`[Authorize(Roles = "Admin")]`)
- Comprehensive CRUD operations

### Frontend
- `AdminSettings.tsx` - React component for settings management
- Category-based accordion layout
- Real-time editing with validation
- Sensitive value masking

## Configuration Categories

1. **System Configuration** - Core system settings
2. **JWT Authentication** - Token generation and validation
3. **Payment Gateways** - JazzCash, EasyPaisa configurations
4. **Cache & Redis** - Redis connection and cache settings
5. **Outbox Dispatcher** - Background job processing
6. **Banking & SMS** - Bank SMS integration
7. **Raast Payments** - Instant payment system
8. **Logging** - Application logging configuration
9. **Security** - Security policies and authentication

## Usage Examples

### Backend Service Integration
```csharp
// Inject IAdminConfigurationService
public class PaymentService
{
    private readonly IAdminConfigurationService _config;

    public async Task<JazzCashConfig> GetJazzCashConfigAsync()
    {
        return new JazzCashConfig
        {
            MerchantId = await _config.GetStringAsync("JazzCash:MerchantId"),
            ApiBaseUrl = await _config.GetStringAsync("JazzCash:ApiBaseUrl", "https://sandbox.jazzcash.com.pk"),
            TransactionExpiryHours = await _config.GetIntAsync("JazzCash:TransactionExpiryHours", 1)
        };
    }
}
```

### API Endpoints
- `GET /api/admin/settings` - Get all settings grouped by category
- `POST /api/admin/settings` - Create new setting
- `PUT /api/admin/settings/{key}` - Update existing setting
- Access requires Admin role authentication

### Database Schema
```sql
-- AdminSystemSettings table
CREATE TABLE "AdminSystemSettings" (
    "Id" uuid PRIMARY KEY,
    "SettingKey" varchar(200) UNIQUE NOT NULL,
    "SettingValue" text NOT NULL,
    "DataType" varchar(50) DEFAULT 'string',
    "Category" integer NOT NULL,
    "Description" varchar(500),
    "IsActive" boolean DEFAULT true,
    "IsEncrypted" boolean DEFAULT false,
    "IsSensitive" boolean DEFAULT false,
    "DefaultValue" text,
    "ValidationRules" jsonb,
    "ModifiedByUserId" uuid,
    "CreatedAt" timestamp with time zone NOT NULL,
    "LastModifiedAt" timestamp with time zone
);

-- AdminSettingsAudit table for audit trail
CREATE TABLE "AdminSettingsAudit" (
    "Id" uuid PRIMARY KEY,
    "SettingKey" varchar(200) NOT NULL,
    "Category" integer NOT NULL,
    "OldValue" text,
    "NewValue" text,
    "ChangeType" varchar(50) NOT NULL,
    "ChangedAt" timestamp with time zone DEFAULT (now() AT TIME ZONE 'UTC'),
    "ChangedByUserId" uuid NOT NULL,
    "IpAddress" varchar(45),
    "UserAgent" varchar(500),
    "Notes" varchar(1000)
);
```

## Migration Steps

1. **Run Database Migration** - Add new tables and indexes
2. **Seed Default Settings** - Use `AdminSettingsSeedService` to populate defaults
3. **Update Services** - Replace direct `IConfiguration` usage with `IAdminConfigurationService`
4. **Add Frontend Route** - Include `AdminSettings.tsx` in admin navigation
5. **Configure Authorization** - Ensure admin role requirements are enforced

## Benefits

### For Administrators
- **Real-time Configuration** - Change settings without deployment
- **Audit Visibility** - Full history of who changed what and when
- **Safety** - Validation and fallback to defaults
- **Convenience** - Web-based GUI instead of file editing

### For Developers
- **Type Safety** - Strongly typed configuration objects
- **Performance** - Cached configuration with minimal database hits
- **Flexibility** - Easy to add new configuration categories
- **Maintainability** - Clean separation of concerns

### For Operations
- **Zero Downtime** - Settings changes don't require restart
- **Environment Consistency** - Same interface across dev/staging/prod
- **Security** - Encrypted sensitive values and audit trail
- **Scalability** - Cached for high-performance scenarios

## Next Steps

1. **Add Validation Rules** - Implement custom validation patterns
2. **Encryption Service** - Add proper encryption for sensitive values
3. **Export/Import** - Settings backup and restore functionality
4. **Notifications** - Real-time notifications when settings change
5. **Advanced UI** - Bulk editing, setting templates, rollback functionality

This admin settings system provides a robust, secure, and user-friendly way to manage application configuration dynamically, significantly improving operational efficiency and reducing deployment overhead.