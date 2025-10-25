# Complete Setup Script for YaqeenPay on techtorio.online
# Run this script to set up everything

Write-Host "🚀 Setting up YaqeenPay on techtorio.online" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green

# Step 1: Copy Cloudflare config
Write-Host "`n📝 Step 1: Updating Cloudflare configuration..." -ForegroundColor Yellow

$sourceConfig = ".\cloudflare-config.yml"
$targetConfig = "$env:USERPROFILE\.cloudflared\config.yml"

if (Test-Path $sourceConfig) {
    try {
        Copy-Item $sourceConfig $targetConfig -Force
        Write-Host "✅ Cloudflare config updated successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to copy config: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please manually copy the content from cloudflare-config.yml to $targetConfig" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Source config file not found: $sourceConfig" -ForegroundColor Red
}

# Step 2: Ensure Docker is running
Write-Host "`n🐳 Step 2: Starting Docker services..." -ForegroundColor Yellow
try {
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker services started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error with Docker: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test local application
Write-Host "`n🔍 Step 3: Testing local application..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -Method Head -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Local application is running on http://localhost:8080" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Local application is not ready yet. Please check Docker containers." -ForegroundColor Yellow
    Write-Host "Run: docker-compose ps" -ForegroundColor Cyan
}

# Step 4: Display DNS setup instructions
Write-Host "`n🌐 Step 4: DNS Setup Required" -ForegroundColor Yellow
Write-Host "══════════════════════════════" -ForegroundColor Yellow

Write-Host "`nGo to Cloudflare Dashboard → techtorio.online → DNS and add these records:" -ForegroundColor Cyan
Write-Host ""

$tunnelTarget = "niaz.cfargotunnel.com"

Write-Host "📍 Main Domain Record:" -ForegroundColor White
Write-Host "   Type: CNAME" -ForegroundColor Gray
Write-Host "   Name: @ (or leave blank for root domain)" -ForegroundColor Gray
Write-Host "   Target: $tunnelTarget" -ForegroundColor Gray
Write-Host "   Proxy: ✅ Enabled (Orange cloud)" -ForegroundColor Gray

Write-Host "`n📍 API Subdomain Record:" -ForegroundColor White
Write-Host "   Type: CNAME" -ForegroundColor Gray
Write-Host "   Name: api" -ForegroundColor Gray
Write-Host "   Target: $tunnelTarget" -ForegroundColor Gray
Write-Host "   Proxy: ✅ Enabled (Orange cloud)" -ForegroundColor Gray

Write-Host "`n📍 Admin Subdomain Record:" -ForegroundColor White
Write-Host "   Type: CNAME" -ForegroundColor Gray
Write-Host "   Name: admin" -ForegroundColor Gray
Write-Host "   Target: $tunnelTarget" -ForegroundColor Gray
Write-Host "   Proxy: ✅ Enabled (Orange cloud)" -ForegroundColor Gray

# Step 5: Start tunnel
Write-Host "`n🚇 Step 5: Starting Cloudflare tunnel..." -ForegroundColor Yellow

try {
    & .\tunnel-manager.ps1 start
    Write-Host "✅ Cloudflare tunnel started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start tunnel. Please run manually:" -ForegroundColor Red
    Write-Host "   .\tunnel-manager.ps1 start" -ForegroundColor Cyan
}

# Final status
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════" -ForegroundColor Green

Write-Host "`n📊 Current Status:" -ForegroundColor Cyan
Write-Host "🏠 Local: http://localhost:8080" -ForegroundColor White
Write-Host "🌍 Public (after DNS setup):" -ForegroundColor White
Write-Host "   - https://techtorio.online" -ForegroundColor Cyan
Write-Host "   - https://api.techtorio.online" -ForegroundColor Cyan
Write-Host "   - https://admin.techtorio.online" -ForegroundColor Cyan

Write-Host "`n⏱️  DNS propagation may take 5-15 minutes" -ForegroundColor Yellow
Write-Host "🔧 Check tunnel status: .\tunnel-manager.ps1 status" -ForegroundColor White
Write-Host "🛑 Stop tunnel: .\tunnel-manager.ps1 stop" -ForegroundColor White