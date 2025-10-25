#!/usr/bin/env pwsh
# Serve the gateway HTML page locally

$port = 8888
$path = "D:\Work Repos\AI\yaqeenpay\gateway\html"

Write-Host "Starting web server at http://localhost:$port" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

Set-Location $path

# Check if Python is available
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $port
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server $port
} else {
    Write-Host "Python not found. Opening file directly in browser..." -ForegroundColor Yellow
    Start-Process "index.html"
}
