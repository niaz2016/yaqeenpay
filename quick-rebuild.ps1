# Quick Rebuild - Rebuilds and restarts containers
# Use this when you've made code changes and want to test quickly

Write-Host "Quick Rebuild: Rebuilding images and restarting containers..." -ForegroundColor Cyan
Write-Host ""

# Build with docker-compose (faster, uses cache)
docker-compose build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "Restarting containers..." -ForegroundColor Yellow
    docker-compose down
    docker-compose up -d
    
    Write-Host ""
    Write-Host "✓ Containers restarted" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for services to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host ""
    docker ps --filter "name=yaqeenpay" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    Write-Host ""
    Write-Host "Access at: http://localhost" -ForegroundColor Cyan
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
}
