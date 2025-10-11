# How to Access Admin Settings UI

## 🎯 Quick Access Guide

### Step 1: Login as Admin
1. Navigate to your application URL (e.g., `https://localhost:7137` or your deployed URL)
2. Login with an account that has **Admin** role

### Step 2: Access Admin Panel
1. Once logged in as admin, you should see the admin navigation
2. Look for the sidebar/menu with admin options

### Step 3: Find System Settings
1. In the admin sidebar, click on **"System Settings"** (with a settings/gear icon)
2. This will take you to `/admin/settings`

## 🔧 What You'll See

### Main Interface
- **Header**: "Admin System Settings" with description
- **Actions**: "Refresh" and "Add Setting" buttons
- **Settings Groups**: Organized by categories in accordion format

### Setting Categories
1. **System Configuration** - Core system settings
2. **JWT Authentication** - Token settings
3. **Payment Gateways** - JazzCash, EasyPaisa configurations
4. **Cache & Redis** - Redis connection settings
5. **Outbox Dispatcher** - Background job settings
6. **Banking & SMS** - Bank SMS integration
7. **Raast Payments** - Instant payment settings
8. **Logging** - Application logging configuration
9. **Security** - Security policies

### Features Available
- ✅ **View Settings** - See all current values (sensitive ones are masked)
- ✅ **Edit Settings** - Click edit icon to modify values
- ✅ **Add New Settings** - Click "Add Setting" button
- ✅ **Sensitive Values** - Toggle visibility with eye icon
- ✅ **Data Type Validation** - Automatic validation based on type
- ✅ **Audit Trail** - See who changed what and when

## 🛠 Usage Examples

### Common Tasks
1. **Change JWT Token Expiry**:
   - Find "JWT Authentication" category
   - Edit "JwtSettings:ExpiryInMinutes" 
   - Change from 60 to 120 (minutes)

2. **Update JazzCash Settings**:
   - Find "Payment Gateways" category
   - Edit "JazzCash:MerchantId" or "JazzCash:ApiBaseUrl"

3. **Modify Redis Connection**:
   - Find "Cache & Redis" category  
   - Edit "Redis:ConnectionString"

### Adding New Setting
1. Click "Add Setting" button
2. Enter setting key (e.g., "MyApp:NewFeatureEnabled")
3. Enter value (e.g., "true")
4. Select data type (e.g., "Boolean")
5. Choose category
6. Add description
7. Click "Create"

## 🔐 Security Notes

- Only users with **Admin** role can access this page
- Sensitive settings are masked with `***MASKED***`
- All changes are logged with timestamp, user, and IP address
- Settings take effect immediately without server restart

## 🚨 Troubleshooting

### Can't Find Admin Menu?
- Ensure you're logged in with an **Admin** role account
- Check that your user has proper permissions

### 404 Error on /admin/settings?
- Verify the backend API is running
- Check that admin settings API endpoints are properly deployed
- Ensure database migrations have been applied

### Settings Not Loading?
- Check browser console for errors
- Verify API token is valid
- Ensure backend admin settings service is registered in DI

## 📍 Direct URL
If you have admin access, you can directly navigate to:
```
https://your-domain.com/admin/settings
```

## 🔄 Effect of Changes
- **Immediate**: Changes take effect instantly without server restart
- **Cached**: Values are cached for 5 minutes for performance
- **Fallback**: If database value doesn't exist, uses appsettings.json default
- **Audit**: All changes are tracked in AdminSettingsAudit table

## 📊 Benefits
- **Zero Downtime Configuration** - No server restarts needed
- **Environment Agnostic** - Same interface across dev/staging/prod
- **Audit Compliant** - Full change tracking
- **Type Safe** - Validation based on data types
- **User Friendly** - Clean web interface vs editing config files