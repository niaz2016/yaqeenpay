#!/usr/bin/env pwsh
# Comprehensive diagnostic script

$serverIP = "16.170.233.86"
$keyPath = "C:\Users\Precision\Downloads\firstKey.pem"

Write-Host "Running comprehensive diagnostics..." -ForegroundColor Cyan

# Create a temp file on the server to collect all diagnostics
ssh -i $keyPath ubuntu@$serverIP @"
sudo bash -c '
echo "=== ALL LISTENING PORTS ==="
ss -tlnp

echo ""
echo "=== NGINX CONFIGURATION ==="
cat /etc/nginx/sites-enabled/yaqeenpay 2>/dev/null || cat /etc/nginx/sites-enabled/default

echo ""
echo "=== PROCESS LISTENING PORTS ==="
lsof -i -P -n | grep LISTEN | grep dotnet

echo ""
echo "=== CURL TEST TO PORT 5000 ==="
curl -v http://localhost:5000/health 2>&1 | head -n 20

echo ""
echo "=== CURL TEST TO PORT 8080 ==="
curl -v http://localhost:8080/health 2>&1 | head -n 20

echo ""
echo "=== LAST 30 STARTUP LOGS ==="
journalctl -u yaqeenpay -n 30 --no-pager | grep -i "listening\|started\|now listening\|application started"
' > /tmp/diagnostic.txt 2>&1

cat /tmp/diagnostic.txt
"@
