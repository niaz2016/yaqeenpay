# KYC Document Upload Troubleshooting Guide

## Issue Fixed: 415 Unsupported Media Type Error

### Root Cause
The error was caused by manually setting the `Content-Type: multipart/form-data` header when using FormData with axios. This prevents the browser from setting the correct boundary parameter.

### Changes Made

#### 1. Fixed sellerService.ts
**Before:**
```typescript
return apiService.post('/SellerRegistration/kyc-document', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

**After:**
```typescript
return apiService.post('/SellerRegistration/kyc-document', formData);
// Let the browser set Content-Type automatically with boundary
```

#### 2. Fixed All FormData Uploads
- `uploadKycDocument()` - Individual KYC document upload
- `applyForSellerRole()` - Complete seller registration with documents
- `uploadShipmentProof()` - Order shipment proof upload

### How to Test the Fix

#### 1. Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading a KYC document
4. Look for the request to `/SellerRegistration/apply`
5. Check the request headers - should see:
   ```
   Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
   ```

#### 2. Check Console Logs
The seller service now includes detailed logging:
```javascript
// Look for these console logs:
"Applying for seller role with data:"
"Added business profile field: businessName = ..."
"Adding KYC document 0: { documentType: 'BusinessLicense', fileName: '...' }"
"FormData entries:"
```

#### 3. Test File Types
Try uploading these file types to ensure they work:
- ✅ PDF documents (.pdf)
- ✅ JPEG images (.jpg, .jpeg)  
- ✅ PNG images (.png)
- ❌ Other types should be rejected with appropriate error

#### 4. Test File Sizes
- ✅ Files under 5MB should work
- ❌ Files over 5MB should be rejected

### Expected Backend API Format

The frontend now sends FormData with this structure:

```
FormData {
  // Business Profile Fields
  businessName: "Your Business Name"
  businessType: "LLC"
  businessCategory: "Technology"
  description: "Business description"
  phoneNumber: "+1234567890"
  address: "123 Main St"
  city: "New York"
  state: "NY"
  country: "USA"
  postalCode: "10001"
  website: "https://yourbusiness.com"
  
  // KYC Documents
  kycDocuments[0].documentType: "BusinessLicense"
  kycDocuments[0].file: [File object]
  kycDocuments[1].documentType: "IdentityDocument"
  kycDocuments[1].file: [File object]
}
```

### If Still Getting 415 Error

#### Check Backend Configuration
1. **Ensure multipart support** is enabled in your backend
2. **Check file size limits** on the server
3. **Verify endpoint exists**: `/SellerRegistration/apply`
4. **Check CORS settings** for file uploads

#### .NET Core Example Configuration
```csharp
// In Startup.cs or Program.cs
services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
});

// Controller action
[HttpPost("apply")]
public async Task<IActionResult> ApplyForSellerRole(SellerApplicationDto model)
{
    // model.KycDocuments should be List<IFormFile>
    foreach (var doc in model.KycDocuments)
    {
        // Process file
        Console.WriteLine($"Received file: {doc.FileName}, Size: {doc.Length}");
    }
}
```

### Alternative Testing with Individual Upload

If the complete registration still fails, you can test individual document upload:

```typescript
// Test individual file upload
const testFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
await sellerService.uploadKycDocument("BusinessLicense", testFile);
```

### Common Issues and Solutions

#### 1. File Type Rejected
- **Issue**: Backend doesn't accept the file type
- **Solution**: Check backend file type validation, ensure it matches frontend allowed types

#### 2. File Too Large
- **Issue**: Backend has smaller file size limit than frontend (5MB)
- **Solution**: Adjust backend configuration or frontend validation

#### 3. Form Field Names Don't Match
- **Issue**: Backend expects different field names
- **Solution**: Update the FormData field names to match backend model

#### 4. Authentication Issues
- **Issue**: 401/403 errors during upload
- **Solution**: Ensure auth token is included in the request headers

### Success Indicators

✅ **Upload Successful When:**
- Network request shows 200/201 status
- Response contains success message or registration ID
- Console logs show all FormData entries correctly
- File appears in the documents list on frontend

❌ **Upload Failed When:**
- 415 Unsupported Media Type (fixed)
- 413 Payload Too Large (file size issue)
- 400 Bad Request (validation error)
- 401 Unauthorized (auth issue)
- 500 Internal Server Error (backend issue)

This fix should resolve the 415 error. If you're still experiencing issues, check the browser console logs and network tab for more specific error details.