# KYC Submission Error Fix

## Issue
Users were getting a generic error when submitting KYC documents:
```json
{
    "Success": false,
    "Message": "An error occurred while processing your request.",
    "Data": null,
    "Errors": []
}
```

## Root Causes Identified & Fixed

### 1. ✅ Poor Error Handling in Command Handler
**Problem:** The handler didn't validate inputs or provide specific error messages.

**Fixed in:** `SubmitKycDocumentCommandHandler.cs`

**Changes:**
- Added validation for required fields (DocumentBase64, FileName)
- Added try-catch blocks around critical operations
- Provided specific error messages for each failure point
- Fixed null check for userId (changed from `null` to `Guid.Empty`)
- Set CreatedAt timestamp explicitly

### 2. ✅ Insufficient Exception Handling in Middleware
**Problem:** Exception middleware wasn't catching common exception types (ArgumentException, InvalidOperationException, UnauthorizedAccessException).

**Fixed in:** `ExceptionHandlingMiddleware.cs`

**Changes:**
- Added handlers for ArgumentException (400 Bad Request)
- Added handlers for InvalidOperationException (400 Bad Request)
- Added handlers for UnauthorizedAccessException (401 Unauthorized)
- Improved development mode error details (shows inner exceptions and stack traces)
- Enhanced logging to include stack traces

### 3. ✅ Missing API Response Wrapper
**Problem:** Controller wasn't wrapping responses in standard ApiResponse format.

**Fixed in:** `KycController.cs`

**Changes:**
- Wrapped both GET and POST responses in `ApiResponse<T>.SuccessResponse()`
- Added success messages for better user feedback

## Code Changes

### SubmitKycDocumentCommandHandler.cs
```csharp
// Added input validation
if (string.IsNullOrWhiteSpace(request.DocumentBase64))
{
    throw new ArgumentException("Document content is required");
}

// Wrapped document storage in try-catch
try
{
    documentUrl = await _documentStorageService.StoreDocumentAsync(...);
}
catch (Exception ex)
{
    throw new InvalidOperationException($"Failed to upload document: {ex.Message}", ex);
}

// Wrapped database save in try-catch
try
{
    await _dbContext.SaveChangesAsync(cancellationToken);
}
catch (Exception ex)
{
    throw new InvalidOperationException($"Failed to save KYC document: {ex.Message}", ex);
}
```

### ExceptionHandlingMiddleware.cs
```csharp
// Added new exception handlers
case UnauthorizedAccessException unauthorizedException:
    statusCode = HttpStatusCode.Unauthorized;
    errorResponse.Message = unauthorizedException.Message;
    break;

case ArgumentException argumentException:
    statusCode = HttpStatusCode.BadRequest;
    errorResponse.Message = argumentException.Message;
    break;

case InvalidOperationException invalidOpException:
    statusCode = HttpStatusCode.BadRequest;
    errorResponse.Message = invalidOpException.Message;
    break;
```

### KycController.cs
```csharp
[HttpPost]
public async Task<IActionResult> SubmitDocument(SubmitKycDocumentCommand command)
{
    var result = await Mediator.Send(command);
    return Ok(ApiResponse<object>.SuccessResponse(result, "KYC document submitted successfully"));
}
```

## Testing Checklist

### Before Testing - Deploy Changes
```powershell
cd "d:\Work Repos\AI\yaqeenpay\Backend"
dotnet publish YaqeenPay.API/YaqeenPay.API.csproj -c Release -o ./publish
scp -i "C:\Users\Precision\Downloads\firstKey.pem" -r ./publish/* ubuntu@16.170.233.86:/opt/techtorio/backend/
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86 "sudo systemctl restart yaqeenpay"
```

### Test Cases

#### 1. Missing Document Content
**Request:**
```json
{
    "DocumentType": "NationalId",
    "DocumentNumber": "123456",
    "DocumentBase64": "",
    "FileName": "id.jpg"
}
```
**Expected Response:** 400 Bad Request
```json
{
    "Success": false,
    "Message": "Document content is required",
    "Data": null,
    "Errors": []
}
```

#### 2. Missing File Name
**Request:**
```json
{
    "DocumentType": "NationalId",
    "DocumentNumber": "123456",
    "DocumentBase64": "base64data...",
    "FileName": ""
}
```
**Expected Response:** 400 Bad Request
```json
{
    "Success": false,
    "Message": "File name is required",
    "Data": null,
    "Errors": []
}
```

#### 3. Valid Submission
**Request:**
```json
{
    "DocumentType": "NationalId",
    "DocumentNumber": "12345-6789012-3",
    "DocumentBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "FileName": "national_id.jpg"
}
```
**Expected Response:** 200 OK
```json
{
    "Success": true,
    "Message": "KYC document submitted successfully",
    "Data": {
        "Id": "guid",
        "DocumentType": "NationalId",
        "DocumentNumber": "12345-6789012-3",
        "DocumentUrl": "/documents/userId/kyc/filename.jpg",
        "Status": "Pending",
        "CreatedAt": "2025-10-25T..."
    },
    "Errors": []
}
```

#### 4. Unauthenticated Request
**Request:** No Authorization header
**Expected Response:** 401 Unauthorized

### Server Log Monitoring
```bash
# Watch logs in real-time
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86
sudo journalctl -u yaqeenpay -f

# Look for:
# - "An unhandled exception occurred" - Shows full error details
# - Stack traces in development mode
# - Specific error messages (document upload, database save, etc.)
```

## Common Error Scenarios

### 1. File Storage Permission Error
**Symptom:** "Failed to upload document: Access to path denied"
**Solution:** Check directory permissions
```bash
sudo chown -R www-data:www-data /opt/techtorio/backend/Documents
sudo chmod -R 755 /opt/techtorio/backend/Documents
```

### 2. Invalid Base64 Format
**Symptom:** "Failed to upload document: Invalid length for Base64"
**Solution:** Frontend should ensure proper base64 encoding, remove data URI prefix if needed

### 3. Database Connection Error
**Symptom:** "Failed to save KYC document: Connection timeout"
**Solution:** Check PostgreSQL service and connection string

### 4. User Not Found
**Symptom:** "User not found"
**Solution:** Verify JWT token is valid and user exists in database

## Development vs Production Behavior

### Development Mode
- Shows full exception messages
- Includes stack traces in Errors array
- Shows inner exception details
- More verbose logging

### Production Mode
- Generic error messages for security
- No stack traces exposed
- Minimal error details to client
- Full details in server logs only

## Frontend Integration Notes

The frontend should handle these response types:

```typescript
interface KycSubmissionResponse {
    Success: boolean;
    Message: string;
    Data: {
        Id: string;
        DocumentType: string;
        DocumentNumber: string;
        DocumentUrl: string;
        Status: string;
        CreatedAt: string;
    } | null;
    Errors: string[];
}

// Success handling
if (response.Success) {
    showSuccess(response.Message);
    // Update UI to show submitted status
}

// Error handling
if (!response.Success) {
    showError(response.Message);
    if (response.Errors.length > 0) {
        // Show detailed errors
        response.Errors.forEach(error => console.error(error));
    }
}
```

## Next Steps

1. **Deploy to Production** ✅ Build completed
2. **Test with Real Data** - Submit actual KYC documents
3. **Monitor Logs** - Watch for any errors during submission
4. **Verify File Storage** - Check that documents are saved correctly
5. **Test User Status Update** - Verify KYC status changes from Pending → Submitted

## Rollback Plan

If issues persist:

```bash
# Revert to previous version
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86
cd /opt/techtorio/backend
sudo systemctl stop yaqeenpay

# Restore previous backup (if available)
# Or redeploy previous git commit

sudo systemctl start yaqeenpay
```

---

**Last Updated:** 2025-10-25  
**Status:** ✅ Ready for Deployment  
**Build Status:** ✅ Successful
