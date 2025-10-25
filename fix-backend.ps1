# Fix Backend Script
Write-Host "`n=== Fixing YaqeenPay Backend ===" -ForegroundColor Cyan

$sshKey = "C:\Users\Precision\Downloads\firstKey.pem"
$server = "ubuntu@16.170.233.86"

# Step 1: Restore the original working appsettings
Write-Host "`n1. Restoring original Production appsettings (without MacroDroid)..." -ForegroundColor Yellow
$originalJson = @'
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=yaqeenpay;Username=yaqeenpayuser;Password=YaqeenPay@2025!Secure;Port=5432;Pooling=true;MinPoolSize=5;MaxPoolSize=100;CommandTimeout=60;Timeout=60;"
  },
  "Urls": "http://0.0.0.0:5000",
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "Cors": {
    "AllowedOrigins": [
      "https://techtorio.online",
      "https://www.techtorio.online",
      "http://techtorio.online",
      "http://www.techtorio.online"
    ]
  }
}
'@

$originalJson | ssh -i $sshKey $server "cat > /tmp/appsettings.Production.json && sudo mv /tmp/appsettings.Production.json /opt/techtorio/backend/appsettings.Production.json"

Write-Host "Done. Verifying JSON..." -ForegroundColor Green
ssh -i $sshKey $server "sudo jq '.' /opt/techtorio/backend/appsettings.Production.json > /dev/null 2>&1 && echo 'JSON is valid' || echo 'ERROR: JSON is still invalid'"

# Step 2: Clear environment overrides that might be causing issues
Write-Host "`n2. Clearing environment variable overrides..." -ForegroundColor Yellow
ssh -i $sshKey $server "sudo systemctl unset-environment ASPNETCORE_ENVIRONMENT MacroDroid__Enabled MacroDroid__BaseUrl MacroDroid__Key MacroDroid__Action MacroDroid__OtpParamName MacroDroid__ReceiverParamName 2>/dev/null || true"

# Step 3: Reload systemd and restart service
Write-Host "`n3. Restarting service..." -ForegroundColor Yellow
ssh -i $sshKey $server "sudo systemctl daemon-reload && sudo systemctl restart yaqeenpay"

Write-Host "`nWaiting 3 seconds for service to start..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Step 4: Check status
Write-Host "`n4. Service Status:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo systemctl status yaqeenpay --no-pager -n 15"

# Step 5: Test health endpoint
Write-Host "`n5. Testing health endpoint:" -ForegroundColor Yellow
ssh -i $sshKey $server "curl -s http://localhost:5000/health 2>&1 || echo 'Health check failed'"

Write-Host "`n=== Fix Complete ===" -ForegroundColor Cyan
Write-Host "If the service is running, try logging in now." -ForegroundColor Green
Write-Host "If it's still failing, run diagnose-backend.ps1 and share the output." -ForegroundColor Yellow
