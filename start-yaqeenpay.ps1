# YaqeenPay Complete Startup Script
# This script starts both your Docker application and Cloudflare tunnel
# Save as: start-yaqeenpay.ps1

Write-Host "Starting YaqeenPay Application Stack..." -ForegroundColor Green

# Change to project directory
$ProjectPath = "D:\Work Repos\AI\yaqeenpay"
Set-Location $ProjectPath

Write-Host "Project directory: $ProjectPath" -ForegroundColor Cyan

# 1. Start Docker Compose services
Write-Host "`n Starting Docker services..." -ForegroundColor Yellow
try {
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker services started successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to start Docker services" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error starting Docker: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Wait for services to be ready
Write-Host "`nWaiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 3. Check if local application is accessible
Write-Host "`nTesting local application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 5 -UseBasicParsing
    Write-Host "Local application is running on http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "Local application might not be ready yet, but continuing..." -ForegroundColor Yellow
}

# 4. Start Cloudflare tunnel
Write-Host "`nStarting Cloudflare tunnel..." -ForegroundColor Yellow
try {
    & .\tunnel-manager.ps1 start
    Write-Host "Cloudflare tunnel started" -ForegroundColor Green
} catch {
    Write-Host "Failed to start Cloudflare tunnel: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Show status
Write-Host "`nFinal Status:" -ForegroundColor Cyan
Write-Host "════════════════" -ForegroundColor Cyan

# Docker status
Write-Host "`nDocker Services:" -ForegroundColor Yellow
docker-compose ps

# Tunnel status
Write-Host "`nTunnel Status:" -ForegroundColor Yellow
& .\tunnel-manager.ps1 status

Write-Host "`n YaqeenPay startup complete!" -ForegroundColor Green
Write-Host "Local access: http://localhost:8080" -ForegroundColor White
Write-Host "Public access: Configure your domain in Cloudflare DNS" -ForegroundColor White