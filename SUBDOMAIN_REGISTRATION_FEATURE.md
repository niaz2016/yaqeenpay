# Subdomain Registration Feature

## Overview
This feature allows users to search for and request custom subdomains under `techtorio.online` directly from the main landing page.

## Features Implemented

### Frontend (Gateway Landing Page)
- **Real-time subdomain search** with instant availability checking
- **Input validation** (3-63 characters, alphanumeric and hyphens only)
- **Visual feedback** for available, unavailable, and invalid subdomains
- **Professional UI** with feature highlights
- **Responsive design** for mobile and desktop
- **Email application link** for available subdomains

### Backend API
- **Availability Check Endpoint**: `POST /api/subdomain/check`
  - Validates subdomain format
  - Checks against reserved subdomains
  - Queries database for existing registrations
  
- **Request Subdomain Endpoint**: `POST /api/subdomain/request`
  - Accepts subdomain applications
  - Stores applicant information
  - Tracks request status

### Database
- **Subdomains Table** with fields:
  - `Id` - Primary key
  - `Name` - Unique subdomain name
  - `Status` - Pending, Approved, Rejected, Active, Suspended, Reserved
  - `ApplicantEmail` - Contact email
  - `ApplicantName` - Applicant name
  - `Purpose` - Intended use
  - `ContactPhone` - Phone number (optional)
  - `RequestedAt` - Request timestamp
  - `ApprovedAt` - Approval timestamp
  - `ApprovedBy` - Admin who approved
  - `RejectionReason` - Reason for rejection
  - `Notes` - Additional notes
  - `IsActive` - Active status
  - Audit fields (CreatedAt, CreatedBy, etc.)

## File Changes

### Frontend Files
1. **`gateway/html/index.html`**
   - Added subdomain search section
   - Integrated JavaScript for availability checking
   - Email application functionality

2. **`gateway/html/styles.css`**
   - New styles for subdomain search interface
   - Responsive design updates
   - Status indicator styles (available, unavailable, error)

### Backend Files
1. **`Backend/YaqeenPay.Domain/Entities/Subdomain.cs`**
   - New entity for subdomain management

2. **`Backend/YaqeenPay.API/Controllers/SubdomainController.cs`**
   - API endpoints for subdomain operations
   - Validation logic
   - Reserved subdomain checking

3. **`Backend/YaqeenPay.Infrastructure/Persistence/ApplicationDbContext.cs`**
   - Added `Subdomains` DbSet

4. **`Backend/YaqeenPay.Application/Common/Interfaces/IApplicationDbContext.cs`**
   - Added `Subdomains` property to interface

### Database Scripts
1. **`Backend/add-subdomain-migration.ps1`**
   - PowerShell script to create and apply EF Core migration

2. **`Backend/create-subdomains-table.sql`**
   - Direct SQL script to create table (alternative to migration)

## Setup Instructions

### Option 1: Using Entity Framework Migration (Recommended)
```powershell
cd Backend
.\add-subdomain-migration.ps1
```

### Option 2: Using SQL Script
```powershell
# Connect to your PostgreSQL database and run:
psql -U your_username -d yaqeenpay -f Backend/create-subdomains-table.sql
```

### Option 3: Manual Migration
```powershell
cd Backend/YaqeenPay.Infrastructure

dotnet ef migrations add AddSubdomainTable `
    --startup-project ..\YaqeenPay.API\YaqeenPay.API.csproj `
    --context ApplicationDbContext

dotnet ef database update `
    --startup-project ..\YaqeenPay.API\YaqeenPay.API.csproj
```

## Testing the Feature

### 1. View the Landing Page
Access the page at: `http://localhost:9000` (or your configured gateway URL)

### 2. Test Subdomain Search
- Enter a subdomain name (e.g., "mycompany")
- Click "Check Availability"
- System will validate and check against database

### 3. Test Cases
- **Valid available**: `mycompany` → Shows "Available" with Apply link
- **Reserved**: `www`, `admin`, `api` → Shows "Reserved for system use"
- **Invalid format**: `my_company`, `ab` → Shows validation error
- **Already taken**: `yaqeenpay` → Shows "Already taken"

### 4. Application Process
- If available, click "Apply Now" link
- Opens email client with pre-filled subject
- User can send application to `support@techtorio.online`

## API Endpoints

### Check Subdomain Availability
```http
POST /api/subdomain/check
Content-Type: application/json

{
  "subdomain": "mycompany"
}
```

**Response (Available):**
```json
{
  "available": true,
  "subdomain": "mycompany"
}
```

**Response (Unavailable):**
```json
{
  "available": false,
  "subdomain": "yaqeenpay"
}
```

### Request Subdomain (Future Enhancement)
```http
POST /api/subdomain/request
Content-Type: application/json

{
  "subdomain": "mycompany",
  "email": "user@example.com",
  "name": "John Doe",
  "purpose": "Business website",
  "phone": "+1234567890"
}
```

## Reserved Subdomains
The following subdomains are reserved and cannot be registered:
- www, mail, ftp
- admin, api, app
- dev, test, staging, prod
- status, support, help, docs, blog
- yaqeenpay, techtorio
- cdn, static, assets

## Admin Management (Future Enhancement)
Potential admin features to implement:
- Dashboard to view all subdomain requests
- Approve/reject functionality
- Email notifications to applicants
- Subdomain configuration management
- DNS automation integration

## Security Considerations
- Input validation on both frontend and backend
- SQL injection prevention (using EF Core parameterized queries)
- Rate limiting (to be implemented)
- Email verification (to be implemented)
- Reserved subdomain protection

## Future Enhancements
1. **Automated DNS Configuration**: Integrate with Cloudflare API
2. **Online Application Form**: Replace email with web form
3. **Payment Integration**: Accept payments for premium subdomains
4. **Admin Dashboard**: Manage requests, approvals, and configurations
5. **Email Notifications**: Automated emails for status updates
6. **Analytics**: Track popular subdomain searches
7. **Pricing Tiers**: Different prices for different subdomain lengths

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check connection string in `appsettings.json`
- Verify database user permissions

### API Not Responding
- Check if backend API is running
- Verify CORS configuration allows gateway domain
- Check browser console for errors

### Migration Errors
- Ensure no pending migrations: `dotnet ef migrations list`
- Drop and recreate database if needed (dev only)
- Check Entity Framework tools are installed

## Configuration

### CORS (if needed)
Ensure the API allows requests from the gateway:
```csharp
// In Program.cs or Startup.cs
app.UseCors(policy => policy
    .WithOrigins("https://techtorio.online", "http://localhost:9000")
    .AllowAnyMethod()
    .AllowAnyHeader());
```

## Notes
- The frontend currently opens an email client for applications
- The `/api/subdomain/request` endpoint is ready but not connected to frontend
- Future versions can replace email with direct form submission
- All subdomains are stored in lowercase for consistency
