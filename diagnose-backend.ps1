# Backend Diagnostic Script
Write-Host "`n=== YaqeenPay Backend Diagnostics ===" -ForegroundColor Cyan

$sshKey = "C:\Users\Precision\Downloads\firstKey.pem"
$server = "ubuntu@16.170.233.86"

Write-Host "`n1. Service Status:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo systemctl status yaqeenpay --no-pager -n 20"

Write-Host "`n2. Recent Logs (last 50 lines):" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo journalctl -u yaqeenpay --no-pager -n 50"

Write-Host "`n3. Process Check:" -ForegroundColor Yellow
ssh -i $sshKey $server "ps aux | grep '[d]otnet'"

Write-Host "`n4. Port 5000 Status:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo netstat -tlnp | grep 5000 || echo 'Port 5000 not listening'"

Write-Host "`n5. Appsettings.Production.json:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo cat /opt/techtorio/backend/appsettings.Production.json"

Write-Host "`n6. JSON Validation:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo jq '.' /opt/techtorio/backend/appsettings.Production.json > /dev/null 2>&1 && echo 'JSON is valid' || echo 'JSON is INVALID'"

Write-Host "`n7. Environment Variables:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo systemctl show-environment | grep -E '(ASPNETCORE|MacroDroid)'"

Write-Host "`n8. Service File:" -ForegroundColor Yellow
ssh -i $sshKey $server "sudo cat /etc/systemd/system/yaqeenpay.service"

Write-Host "`n=== End Diagnostics ===" -ForegroundColor Cyan
