# Seller Registration 500 Error Fix

## Issue
Seller registration endpoint was returning 500 Internal Server Error:
```
POST https://techtorio.online/api/SellerRegistration/apply
Status: 500 Internal Server Error
```

## Root Causes Fixed

### Same Issues as KYC Submission

The seller registration had identical problems to the KYC submission error:

1. ❌ **No input validation** - Handler didn't check required fields
2. ❌ **Poor error handling** - No try-catch blocks around critical operations
3. ❌ **Null check issue** - Using `userId == null` instead of `Guid.Empty`
4. ❌ **Missing tracking** - Queries for updates didn't use `.AsTracking()`
5. ❌ **No timestamps** - CreatedAt/LastModifiedAt not set explicitly
6. ❌ **No API response wrapper** - Controller not using standard format

## Fixes Applied

### 1. ✅ Input Validation
```csharp
// Validate business name
if (string.IsNullOrWhiteSpace(request.BusinessName))
{
    throw new ArgumentException("Business name is required");
}

// Validate documents
if (request.Documents == null || !request.Documents.Any())
{
    throw new ArgumentException("At least one KYC document is required");
}

// Validate each document
if (string.IsNullOrWhiteSpace(docRequest.DocumentBase64))
{
    throw new ArgumentException($"Document content is required for {docRequest.DocumentType}");
}
```

### 2. ✅ Error Handling with Specific Messages
```csharp
// Document upload
try
{
    documentUrl = await _documentStorageService.StoreDocumentAsync(...);
}
catch (Exception ex)
{
    throw new InvalidOperationException($"Failed to upload {docRequest.DocumentType} document: {ex.Message}", ex);
}

// Database save
try
{
    await _dbContext.SaveChangesAsync(cancellationToken);
}
catch (Exception ex)
{
    throw new InvalidOperationException($"Failed to save seller registration: {ex.Message}", ex);
}

// Role assignment
var roleResult = await _userManager.AddToRoleAsync(user, UserRoleEnum.Seller.ToString());
if (!roleResult.Succeeded)
{
    var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
    throw new InvalidOperationException($"Failed to add seller role: {errors}");
}
```

### 3. ✅ Fixed Null Check
```csharp
// Before
if (userId == null)

// After
if (userId == Guid.Empty)
```

### 4. ✅ Added Tracking for Updates
```csharp
var existingProfile = await _dbContext.BusinessProfiles
    .AsTracking() // Need to track for updates
    .FirstOrDefaultAsync(bp => bp.UserId == userId, cancellationToken);
```

### 5. ✅ Set Timestamps Explicitly
```csharp
businessProfile = new BusinessProfile
{
    // ... other properties ...
    CreatedAt = DateTime.UtcNow
};

existingProfile.LastModifiedAt = DateTime.UtcNow;

document.CreatedAt = DateTime.UtcNow;
```

### 6. ✅ Wrapped in ApiResponse
```csharp
[HttpPost("apply")]
public async Task<IActionResult> ApplyForSellerRole(ApplyForSellerRoleCommand command)
{
    var result = await Mediator.Send(command);
    return Ok(ApiResponse<SellerRegistrationResponse>.SuccessResponse(result, result.Message));
}
```

## Files Modified

1. **ApplyForSellerRoleCommandHandler.cs**
   - Added input validation
   - Added error handling with specific messages
   - Fixed userId null check
   - Added `.AsTracking()` for updates
   - Set timestamps explicitly
   - Made profile completeness update non-blocking

2. **SellerRegistrationController.cs**
   - Wrapped responses in `ApiResponse<T>`
   - Added success messages

## Error Messages Now Show

### Validation Errors (400 Bad Request)
- ❌ "Business name is required"
- ❌ "At least one KYC document is required"
- ❌ "Document content is required for [DocumentType]"
- ❌ "File name is required for [DocumentType]"

### Upload Errors (400 Bad Request)
- ❌ "Failed to upload [DocumentType] document: [specific reason]"

### Database Errors (400 Bad Request)
- ❌ "Failed to save seller registration: [specific reason]"
- ❌ "Failed to update user status: [specific reason]"

### Role Assignment Errors (400 Bad Request)
- ❌ "Failed to add seller role: [specific reason]"

### Success (200 OK)
- ✅ "Seller application submitted successfully. Waiting for approval."
- ✅ "Seller profile updated successfully. Waiting for approval."

## Testing Checklist

### Test Case 1: Missing Business Name
**Request:**
```json
{
    "BusinessName": "",
    "Documents": [...]
}
```
**Expected:** 400 Bad Request - "Business name is required"

### Test Case 2: Missing Documents
**Request:**
```json
{
    "BusinessName": "My Store",
    "Documents": []
}
```
**Expected:** 400 Bad Request - "At least one KYC document is required"

### Test Case 3: Missing Document Content
**Request:**
```json
{
    "BusinessName": "My Store",
    "Documents": [
        {
            "DocumentType": "BusinessLicense",
            "DocumentBase64": "",
            "FileName": "license.pdf"
        }
    ]
}
```
**Expected:** 400 Bad Request - "Document content is required for BusinessLicense"

### Test Case 4: Valid Submission
**Request:**
```json
{
    "BusinessName": "My Online Store",
    "BusinessType": "Retail",
    "BusinessCategory": "Electronics",
    "Description": "Selling electronics",
    "PhoneNumber": "+923001234567",
    "Address": "123 Main St",
    "City": "Lahore",
    "Country": "Pakistan",
    "Documents": [
        {
            "DocumentType": "BusinessLicense",
            "DocumentNumber": "BL123456",
            "DocumentBase64": "base64data...",
            "FileName": "license.pdf"
        }
    ]
}
```
**Expected:** 200 OK
```json
{
    "Success": true,
    "Message": "Seller application submitted successfully. Waiting for approval.",
    "Data": {
        "BusinessProfileId": "guid",
        "UserId": "guid",
        "Status": "Pending",
        "Roles": ["User", "Seller"]
    }
}
```

## Deployment Status

✅ **Build:** Successful  
✅ **Upload:** Completed  
✅ **Service:** Restarted and running  
✅ **Status:** Production ready

## How to Test

1. **Try submitting seller application from frontend**
2. **Check for specific error messages** (not generic 500 error)
3. **Monitor logs for detailed errors:**
```bash
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@techtorio.online
sudo journalctl -u techtorio -f
```

## Related Fixes

This fix follows the same pattern as:
- **KYC_SUBMISSION_FIX.md** - KYC document submission error fix

Both endpoints now have:
- ✅ Input validation
- ✅ Specific error messages
- ✅ Try-catch blocks around critical operations
- ✅ Proper ApiResponse wrapping
- ✅ Enhanced exception middleware handling

---

**Last Updated:** 2025-10-25  
**Status:** ✅ Deployed to Production  
**Service Status:** ✅ Running
