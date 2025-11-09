# PowerShell script to test backend connectivity from your network
# Run this BEFORE building APK to verify backend is accessible

Write-Host "🔍 Backend Connection Test" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Read API URL from .env.production
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    exit 1
}

$apiUrlLine = Select-String -Path ".env.production" -Pattern "^VITE_API_URL" | Select-Object -First 1 -ExpandProperty Line
$apiUrl = ($apiUrlLine -split "=")[1].Trim()
Write-Host "📝 Configured API URL: $apiUrl" -ForegroundColor Green
Write-Host ""

# Extract base URL (remove /api suffix for health check)
$baseUrl = $apiUrl -replace "/api$", ""

# Step 2: Show your network IPs
Write-Host "💻 Your Network IP Addresses:" -ForegroundColor Green
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." } | Select-Object -ExpandProperty IPAddress
foreach ($ip in $ips) {
    Write-Host "   $ip" -ForegroundColor White
}
Write-Host ""

# Step 3: Test connection to API
Write-Host "🔌 Testing connection to API..." -ForegroundColor Cyan
Write-Host "   URL: $apiUrl" -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "$apiUrl" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✓ Connection successful!" -ForegroundColor Green
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Connection failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "   1. Make sure your backend is running" -ForegroundColor White
    Write-Host "   2. Check if the IP address and port are correct" -ForegroundColor White
    Write-Host "   3. Verify Windows Firewall allows connections on this port" -ForegroundColor White
    Write-Host "   4. Try accessing $apiUrl in your browser" -ForegroundColor White
    Write-Host ""
    
    # Try health endpoint
    Write-Host "   Trying health endpoint: $baseUrl/health" -ForegroundColor Cyan
    try {
        $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -Method Get -TimeoutSec 5 -UseBasicParsing
        Write-Host "   ✓ Health endpoint accessible!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Health endpoint also failed" -ForegroundColor Red
    }
    
    exit 1
}

Write-Host ""
Write-Host "🌐 Testing from mobile device:" -ForegroundColor Yellow
Write-Host "   Open your phone's browser and navigate to:" -ForegroundColor White
Write-Host "   $apiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "   If this works in phone browser, the APK should work too!" -ForegroundColor White
Write-Host ""

# Step 4: Check Windows Firewall
Write-Host "🔥 Checking Windows Firewall rules..." -ForegroundColor Cyan
$port = ($apiUrl -split ":")[2] -replace "/.*", ""
if ($port) {
    Write-Host "   Checking port: $port" -ForegroundColor White
    $firewallRules = Get-NetFirewallRule | Where-Object { $_.Enabled -eq $true -and $_.Direction -eq "Inbound" } | Get-NetFirewallPortFilter | Where-Object { $_.LocalPort -eq $port }
    
    if ($firewallRules) {
        Write-Host "   ✓ Firewall rule found for port $port" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  No firewall rule found for port $port" -ForegroundColor Yellow
        Write-Host "   You may need to add a firewall rule:" -ForegroundColor White
        Write-Host "   netsh advfirewall firewall add rule name=`"TechTorio Backend`" dir=in action=allow protocol=TCP localport=$port" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  Could not extract port from URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. If connection test passed, run: .\rebuild-apk.ps1" -ForegroundColor White
Write-Host "   2. If connection failed, fix backend accessibility first" -ForegroundColor White
Write-Host ""
