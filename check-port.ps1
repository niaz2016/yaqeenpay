#!/usr/bin/env pwsh
# Port binding diagnostic script

$serverIP = "16.170.233.86"
$keyPath = "C:\Users\Precision\Downloads\firstKey.pem"

Write-Host "=== Checking appsettings.Production.json ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'sudo cat /opt/techtorio/backend/appsettings.Production.json'

Write-Host "`n=== Checking if port 5000 is listening ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'sudo netstat -tlnp | grep 5000 || echo "Port 5000 not found"'

Write-Host "`n=== Last 50 lines of service logs ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'sudo journalctl -u yaqeenpay -n 50 --no-pager'

Write-Host "`n=== Testing direct connection to port 5000 ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'curl -v http://localhost:5000/health 2>&1'

Write-Host "`n=== Checking nginx configuration ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'sudo cat /etc/nginx/sites-enabled/yaqeenpay 2>/dev/null || sudo cat /etc/nginx/sites-enabled/default | grep -A 30 "server {"'

Write-Host "`n=== Process information ===" -ForegroundColor Cyan
ssh -i $keyPath ubuntu@$serverIP 'ps aux | grep dotnet | grep -v grep'
