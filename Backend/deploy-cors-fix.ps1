# TechTorio Backend Deployment Script - CORS Fix for Mobile
# This script stops the service, deploys files, and restarts

$serverKey = "C:\Users\Precision\Downloads\firstKey.pem"
$serverUser = "ubuntu"
$serverHost = "techtorio.online"
$backendPath = "/opt/techtorio/backend"

Write-Host "=== TechTorio Backend Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop the backend service
Write-Host "Step 1: Stopping backend service..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl stop techtorio-backend"
Write-Host "  Service stopped!" -ForegroundColor Green

# Step 2: Deploy main DLL files
Write-Host "`nStep 2: Deploying main application files..." -ForegroundColor Yellow
$mainFiles = @(
    "TechTorio.API.dll",
    "TechTorio.API.pdb",
    "TechTorio.Application.dll",
    "TechTorio.Application.pdb",
    "TechTorio.Domain.dll",
    "TechTorio.Domain.pdb",
    "TechTorio.Infrastructure.dll",
    "TechTorio.Infrastructure.pdb",
    "TechTorio.Shared.dll",
    "TechTorio.Shared.pdb"
)

foreach ($file in $mainFiles) {
    Write-Host "  Uploading $file..." -NoNewline
    scp -i $serverKey "TechTorio.API\bin\Release\net8.0\$file" "$serverUser@${serverHost}:$backendPath/"
    if ($?) {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
    }
}

# Step 3: Restart the backend service
Write-Host "`nStep 3: Starting backend service..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl start techtorio-backend"
Write-Host "  Service started!" -ForegroundColor Green

# Step 4: Check service status
Write-Host "`nStep 4: Checking service status..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl status techtorio-backend --no-pager | head -20"

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "CORS is now configured to allow mobile app requests!" -ForegroundColor Cyan
Write-Host "The mobile app should now be able to login." -ForegroundColor Cyan
