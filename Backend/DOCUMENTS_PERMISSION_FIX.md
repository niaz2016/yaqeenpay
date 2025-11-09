# Documents Directory Permission Fix

## Issue
Backend service was getting permission denied error when trying to save uploaded files:
```
Access to the path '/opt/techtorio/backend/Documents' is denied.
```

## Root Cause
- The backend service runs as `www-data` user
- The `Documents` directory was owned by `ubuntu` user
- The service couldn't write to a directory it doesn't own

## Solution Applied

### 1. Created Required Directories
```bash
sudo mkdir -p /opt/techtorio/backend/Documents
sudo mkdir -p /opt/techtorio/backend/Logs
sudo mkdir -p /opt/techtorio/backend/wwwroot/uploads
```

### 2. Changed Ownership to www-data
```bash
sudo chown -R www-data:www-data /opt/techtorio/backend/Documents
sudo chown -R www-data:www-data /opt/techtorio/backend/Logs
sudo chown -R www-data:www-data /opt/techtorio/backend/wwwroot
```

### 3. Set Proper Permissions
```bash
sudo chmod -R 755 /opt/techtorio/backend/Documents
sudo chmod -R 755 /opt/techtorio/backend/Logs
sudo chmod -R 755 /opt/techtorio/backend/wwwroot
```

### 4. Verified Ownership
```bash
ls -la /opt/techtorio/backend/ | grep -E 'Documents|Logs|wwwroot'

# Output:
drwxr-xr-x 2 www-data www-data Documents
drwxr-xr-x 2 www-data www-data Logs
drwxr-xr-x 4 www-data www-data wwwroot
```

## Directory Structure

```
/opt/techtorio/backend/
├── Documents/              (www-data:www-data, 755) - KYC & Seller documents
│   ├── {userId}/
│   │   ├── kyc/           - User KYC documents
│   │   └── seller-kyc/    - Seller verification documents
├── Logs/                   (www-data:www-data, 755) - Application logs
├── wwwroot/                (www-data:www-data, 755) - Static files
│   └── uploads/           - Product images, etc.
└── [other API files]
```

## Future Deployments

When deploying backend updates, make sure to preserve these directories and their permissions:

### Using rsync (Recommended)
```powershell
# The deploy-backend.ps1 script already excludes these:
--exclude=Documents/
--exclude=Logs/
```

### Manual Deployment
If uploading manually, these directories will be preserved on the server.

## Verification

### Check Service User
```bash
ssh -i "key.pem" ubuntu@techtorio.online "systemctl show techtorio | grep '^User='"
# Output: User=www-data
```

### Check Directory Permissions
```bash
ssh -i "key.pem" ubuntu@techtorio.online "ls -la /opt/techtorio/backend/ | grep -E 'Documents|Logs|wwwroot'"
```

### Test Document Upload
Try uploading a KYC document or seller registration - should work now!

## Troubleshooting

### If Permission Error Persists

**Check if directory exists:**
```bash
ls -la /opt/techtorio/backend/Documents
```

**Check ownership:**
```bash
stat /opt/techtorio/backend/Documents
```

**Re-apply permissions:**
```bash
sudo chown -R www-data:www-data /opt/techtorio/backend/Documents
sudo chmod -R 755 /opt/techtorio/backend/Documents
sudo systemctl restart techtorio
```

### If Service Can't Write to Subdirectories

The service creates subdirectories like `{userId}/kyc/`. Ensure parent directory is writable:
```bash
sudo chmod 755 /opt/techtorio/backend/Documents
```

## Related Configuration

### appsettings.Production.json
```json
{
  "DocumentStorage": {
    "BasePath": "/opt/techtorio/backend/Documents",
    "BaseUrl": "/documents"
  }
}
```

### Nginx Configuration
Ensure nginx can serve uploaded files:
```nginx
location /documents/ {
    alias /opt/techtorio/backend/Documents/;
    autoindex off;
}
```

## Security Notes

### Permission Levels (755)
- **Owner (www-data):** Read, Write, Execute (7)
- **Group (www-data):** Read, Execute (5)
- **Others:** Read, Execute (5)

This allows:
- ✅ Backend service (www-data) can create/read/write files
- ✅ Other services in www-data group can read
- ✅ System can read for backups
- ❌ Public write access denied

### Document Privacy
- Documents are stored under user-specific directories
- Access control should be handled by the API (authentication/authorization)
- Direct file access should be restricted via nginx configuration

---

**Status:** ✅ Fixed  
**Last Updated:** 2025-10-25  
**Service:** Running and can now write to Documents directory
