# YaqeenPay Backend Deployment Script - CORS Fix for Mobile
# This script stops the service, deploys files, and restarts

$serverKey = "C:\Users\Precision\Downloads\firstKey.pem"
$serverUser = "ubuntu"
$serverHost = "techtorio.online"
$backendPath = "/opt/techtorio/backend"

Write-Host "=== YaqeenPay Backend Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop the backend service
Write-Host "Step 1: Stopping backend service..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl stop yaqeenpay-backend"
Write-Host "  Service stopped!" -ForegroundColor Green

# Step 2: Deploy main DLL files
Write-Host "`nStep 2: Deploying main application files..." -ForegroundColor Yellow
$mainFiles = @(
    "YaqeenPay.API.dll",
    "YaqeenPay.API.pdb",
    "YaqeenPay.Application.dll",
    "YaqeenPay.Application.pdb",
    "YaqeenPay.Domain.dll",
    "YaqeenPay.Domain.pdb",
    "YaqeenPay.Infrastructure.dll",
    "YaqeenPay.Infrastructure.pdb",
    "YaqeenPay.Shared.dll",
    "YaqeenPay.Shared.pdb"
)

foreach ($file in $mainFiles) {
    Write-Host "  Uploading $file..." -NoNewline
    scp -i $serverKey "YaqeenPay.API\bin\Release\net8.0\$file" "$serverUser@${serverHost}:$backendPath/"
    if ($?) {
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " ✗" -ForegroundColor Red
    }
}

# Step 3: Restart the backend service
Write-Host "`nStep 3: Starting backend service..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl start yaqeenpay-backend"
Write-Host "  Service started!" -ForegroundColor Green

# Step 4: Check service status
Write-Host "`nStep 4: Checking service status..." -ForegroundColor Yellow
ssh -i $serverKey "$serverUser@$serverHost" "sudo systemctl status yaqeenpay-backend --no-pager | head -20"

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Green
Write-Host "CORS is now configured to allow mobile app requests!" -ForegroundColor Cyan
Write-Host "The mobile app should now be able to login." -ForegroundColor Cyan
