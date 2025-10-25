# Quick Deployment Scripts

## 🚀 Usage

### Deploy Frontend
```powershell
cd Frontend
.\deploy-frontend.ps1
```

### Deploy Backend
```powershell
cd Backend
.\deploy-backend.ps1
```

## ⚡ Why These Scripts?

The old `scp` command uploads **ALL files every time**, even if nothing changed.

These scripts use **rsync** to upload **only changed files**:

| Method | First Deploy | Updates |
|--------|-------------|---------|
| **Old SCP** | 30-40s | 30-40s ❌ |
| **New Rsync** | 30-45s | **2-10s** ✅ |

### Example Output:
```
[1/3] Building frontend...
✅ Build completed successfully

[2/3] Checking for rsync...
✅ Found rsync in Git Bash

[3/3] Uploading changed files to server...
⚡ Smart sync: uploading only changed/new files

Transferring:
  main.js (235KB)
  style.css (12KB)

Skipped: 1,234 unchanged files
Total transferred: 247KB (was 45MB with old method!)

✅ Deployment completed in 3 seconds!
```

## 📋 Prerequisites

You need **one** of these:
1. **Git for Windows** (recommended) - includes rsync
2. **WSL** (Windows Subsystem for Linux)
3. **Chocolatey** - script will auto-install rsync

## 🔧 First-Time Setup

If rsync is not found, the script will help you install it.

**Or install Git for Windows manually:**
https://git-scm.com/download/win

## 💡 Options

```powershell
# Normal deployment (only changed files)
.\deploy-frontend.ps1

# Force full upload (all files)
.\deploy-frontend.ps1 -Force
```

## 📖 Full Documentation

See `DEPLOYMENT_GUIDE.md` for detailed information.
