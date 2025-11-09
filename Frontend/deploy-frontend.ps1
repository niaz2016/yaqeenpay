# Optimized Frontend Deployment Script
# Only uploads changed/new files using rsync

param(
    [switch]$Force  # Use -Force to upload all files
)

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TechTorio Frontend Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FrontendPath = "D:\Work Repos\AI\techtorio\Frontend"
$DistPath = "$FrontendPath\dist"
$SSHKey = "C:\Users\Precision\Downloads\firstKey.pem"
$ServerUser = "ubuntu"
$ServerIP = "techtorio.online"
$ServerPath = "/opt/techtorio/techtorio/"

# Step 1: Build Frontend
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
Set-Location $FrontendPath

$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host " Build failed!" -ForegroundColor Red
    Write-Host $buildOutput
    exit 1
}
Write-Host " Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Check if rsync is available (from Git Bash or WSL)
Write-Host "[2/3] Checking for rsync..." -ForegroundColor Yellow

$rsyncPath = $null

# Try Git Bash rsync first
if (Test-Path "C:\Program Files\Git\usr\bin\rsync.exe") {
    $rsyncPath = "C:\Program Files\Git\usr\bin\rsync.exe"
    Write-Host " Found rsync in Git Bash" -ForegroundColor Green
}
# Try WSL rsync
elseif (Get-Command wsl -ErrorAction SilentlyContinue) {
    $rsyncPath = "wsl"
    Write-Host " Found rsync in WSL" -ForegroundColor Green
}
else {
    Write-Host "  rsync not found. Installing via Chocolatey..." -ForegroundColor Yellow
    
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
    Write-Host " rsync installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Upload changed files using rsync
Write-Host "[3/3] Uploading changed files to server..." -ForegroundColor Yellow

# Convert Windows path to Unix-style for rsync
$distPathUnix = $DistPath -replace '\\', '/' -replace '^([A-Z]):', '/mnt/$1'
$distPathUnix = $distPathUnix.ToLower()

# Rsync options:
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# -z: compress during transfer
# -h: human-readable output
# --delete: remove files on server that don't exist locally
# --progress: show progress
# --stats: show transfer statistics
# -e: specify SSH command with key

$rsyncOptions = @(
    "-avzh",
    "--progress",
    "--stats",
    "-e", "ssh -i `"$SSHKey`" -o StrictHostKeyChecking=no"
)

if ($Force) {
    Write-Host " Force mode: uploading all files" -ForegroundColor Cyan
} else {
    Write-Host " Smart sync: uploading only changed/new files" -ForegroundColor Cyan
    $rsyncOptions += "--update"  # Skip files newer on receiver
}

# Add delete option to remove old files
$rsyncOptions += "--delete"

try {
    if ($rsyncPath -eq "wsl") {
        # Use WSL rsync
        $wslDistPath = wsl wslpath -u "$DistPath"
        wsl rsync $rsyncOptions "${wslDistPath}/" "${ServerUser}@${ServerIP}:${ServerPath}"
    }
    else {
        # Use Git Bash or native rsync
        & $rsyncPath $rsyncOptions "$DistPath/" "${ServerUser}@${ServerIP}:${ServerPath}"
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host " Deployment completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your app is live at: https://techtorio.online/techtorio/" -ForegroundColor Cyan
    } else {
        Write-Host " Upload failed!" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host " Error during upload: $_" -ForegroundColor Red
    
    # Fallback to SCP if rsync fails
    Write-Host ""
    Write-Host "  Falling back to SCP (full upload)..." -ForegroundColor Yellow
    scp -i "$SSHKey" -r "$DistPath\*" "${ServerUser}@${ServerIP}:${ServerPath}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " SCP upload completed" -ForegroundColor Green
    } else {
        Write-Host " SCP upload also failed!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
