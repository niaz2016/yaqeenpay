# Optimized Backend Deployment Script
# Only uploads changed/new files using rsync

param(
    [switch]$Force  # Use -Force to upload all files
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  YaqeenPay Backend Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BackendPath = "D:\Work Repos\AI\yaqeenpay\Backend"
$PublishPath = "$BackendPath\publish"
$SSHKey = "C:\Users\Precision\Downloads\firstKey.pem"
$ServerUser = "ubuntu"
$ServerIP = "16.170.233.86"
$ServerPath = "/opt/techtorio/backend/"

# Step 1: Build Backend
Write-Host "[1/4] Building backend..." -ForegroundColor Yellow
Set-Location $BackendPath

dotnet publish YaqeenPay.API/YaqeenPay.API.csproj -c Release -o ".\publish" --nologo

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Check if rsync is available
Write-Host "[2/4] Checking for rsync..." -ForegroundColor Yellow

$rsyncPath = $null

# Try Git Bash rsync first
if (Test-Path "C:\Program Files\Git\usr\bin\rsync.exe") {
    $rsyncPath = "C:\Program Files\Git\usr\bin\rsync.exe"
    Write-Host "✅ Found rsync in Git Bash" -ForegroundColor Green
}
# Try WSL rsync
elseif (Get-Command wsl -ErrorAction SilentlyContinue) {
    $rsyncPath = "wsl"
    Write-Host "✅ Found rsync in WSL" -ForegroundColor Green
}
else {
    Write-Host "⚠️  rsync not found. Installing via Chocolatey..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    }
    
    # Install rsync via Chocolatey
    choco install rsync -y
    $rsyncPath = "rsync"
    Write-Host "✅ rsync installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Upload changed files using rsync
Write-Host "[3/4] Uploading changed files to server..." -ForegroundColor Yellow

# Rsync options for .NET deployment
$rsyncOptions = @(
    "-avzh",
    "--progress",
    "--stats",
    "-e", "ssh -i `"$SSHKey`" -o StrictHostKeyChecking=no"
)

if ($Force) {
    Write-Host "🔄 Force mode: uploading all files" -ForegroundColor Cyan
} else {
    Write-Host "⚡ Smart sync: uploading only changed/new files" -ForegroundColor Cyan
    $rsyncOptions += "--update"
}

# Add delete option with exclude for runtime files
$rsyncOptions += "--delete"
$rsyncOptions += "--exclude=appsettings.Production.json"  # Don't delete server config
$rsyncOptions += "--exclude=Logs/"  # Don't delete logs
$rsyncOptions += "--exclude=Documents/"  # Don't delete uploaded documents

try {
    if ($rsyncPath -eq "wsl") {
        # Use WSL rsync
        $wslPublishPath = wsl wslpath -u "$PublishPath"
        wsl rsync $rsyncOptions "${wslPublishPath}/" "${ServerUser}@${ServerIP}:${ServerPath}"
    }
    else {
        # Use Git Bash or native rsync
        & $rsyncPath $rsyncOptions "$PublishPath/" "${ServerUser}@${ServerIP}:${ServerPath}"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Upload completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Upload failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "❌ Error during upload: $_" -ForegroundColor Red
    
    # Fallback to SCP
    Write-Host ""
    Write-Host "⚠️  Falling back to SCP (full upload)..." -ForegroundColor Yellow
    scp -i "$SSHKey" -r "$PublishPath\*" "${ServerUser}@${ServerIP}:${ServerPath}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SCP upload completed" -ForegroundColor Green
    } else {
        Write-Host "❌ SCP upload also failed!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 4: Restart API Service
Write-Host "[4/4] Restarting API service..." -ForegroundColor Yellow

ssh -i "$SSHKey" "${ServerUser}@${ServerIP}" "sudo systemctl restart yaqeenpay"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service restarted successfully" -ForegroundColor Green
    Write-Host ""
    
    # Wait a moment and check service status
    Start-Sleep -Seconds 2
    Write-Host "Checking service status..." -ForegroundColor Yellow
    ssh -i "$SSHKey" "${ServerUser}@${ServerIP}" "sudo systemctl status yaqeenpay --no-pager | head -n 10"
} else {
    Write-Host "❌ Service restart failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 API: https://techtorio.online/api/" -ForegroundColor Cyan
Write-Host "📊 Health: https://techtorio.online/api/health" -ForegroundColor Cyan
