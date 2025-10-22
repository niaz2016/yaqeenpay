#!/usr/bin/env pwsh
# Debug APK Network Issues
# This script monitors Android logcat to diagnose network connectivity issues

Write-Host "🔍 APK Network Debugger" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Clear logcat
Write-Host "Clearing logcat..." -ForegroundColor Yellow
adb logcat -c
Start-Sleep -Seconds 1

Write-Host "✅ Logcat cleared" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now open the APK and try to login..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C when you see the error on the app" -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitoring network requests..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Monitor relevant log entries
adb logcat "*:S" `
    "Capacitor/Console:V" `
    "chromium:W" `
    "WebViewFactory:W" `
    "m.yaqeenpay.app:I" `
    | Select-String -Pattern "(192\.168|fetch|CORS|Failed|Mixed Content|SSL|Certificate|ERR_|https://localhost)"
