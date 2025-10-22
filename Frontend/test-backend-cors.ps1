#!/usr/bin/env pwsh
# Backend CORS and Redirect Test Script
# This script tests if the backend is properly configured for APK access

Write-Host "`n🔧 Backend Configuration Test" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$backendUrl = "http://192.168.43.48:5137/api/health"

# Test 1: Check for HTTP → HTTPS redirect
Write-Host "Test 1: Checking for HTTP → HTTPS redirect..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $backendUrl -MaximumRedirection 0 -ErrorAction Stop
    Write-Host "✅ PASS: No redirect (Status: $($response.StatusCode))" -ForegroundColor Green
    $noRedirect = $true
} catch {
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 308) {
        Write-Host "❌ FAIL: Backend is redirecting HTTP to HTTPS (Status: $($_.Exception.Response.StatusCode))" -ForegroundColor Red
        Write-Host "   This breaks CORS preflight requests!" -ForegroundColor Yellow
        $noRedirect = $false
    } else {
        Write-Host "⚠️  Unexpected response: $($_.Exception.Message)" -ForegroundColor Yellow
        $noRedirect = $false
    }
}

# Test 2: Check CORS headers for http://localhost origin
Write-Host "`nTest 2: Checking CORS headers for 'http://localhost' origin..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://localhost'
    }
    $response = Invoke-WebRequest -Uri $backendUrl -Headers $headers -ErrorAction Stop
    
    $allowOrigin = $response.Headers['Access-Control-Allow-Origin']
    if ($allowOrigin -contains 'http://localhost' -or $allowOrigin -contains '*') {
        Write-Host "✅ PASS: CORS allows 'http://localhost' origin" -ForegroundColor Green
        $corsOk = $true
    } else {
        Write-Host "❌ FAIL: CORS doesn't allow 'http://localhost' origin" -ForegroundColor Red
        Write-Host "   Received: $allowOrigin" -ForegroundColor Yellow
        $corsOk = $false
    }
} catch {
    Write-Host "❌ FAIL: CORS request failed: $($_.Exception.Message)" -ForegroundColor Red
    $corsOk = $false
}

# Test 3: Check CORS preflight (OPTIONS request)
Write-Host "`nTest 3: Checking CORS preflight (OPTIONS) request..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://localhost'
        'Access-Control-Request-Method' = 'POST'
        'Access-Control-Request-Headers' = 'content-type'
    }
    $response = Invoke-WebRequest -Uri "http://192.168.43.48:5137/api/auth/login" -Method OPTIONS -Headers $headers -MaximumRedirection 0 -ErrorAction Stop
    
    Write-Host "✅ PASS: CORS preflight succeeded (Status: $($response.StatusCode))" -ForegroundColor Green
    $preflightOk = $true
} catch {
    if ($_.Exception.Response.StatusCode -eq 307 -or $_.Exception.Response.StatusCode -eq 308) {
        Write-Host "❌ FAIL: Preflight is being redirected (Status: $($_.Exception.Response.StatusCode))" -ForegroundColor Red
        Write-Host "   Redirects are not allowed during CORS preflight!" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Preflight response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    $preflightOk = $false
}

# Summary
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

if ($noRedirect -and $corsOk -and $preflightOk) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "   Backend is properly configured for APK access.`n" -ForegroundColor Green
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "`nRequired fixes:`n" -ForegroundColor Yellow
    
    if (-not $noRedirect) {
        Write-Host "   1. Remove app.UseHttpsRedirection() for API routes" -ForegroundColor White
        Write-Host "      See: BACKEND_FIX_QUICK_REFERENCE.md`n" -ForegroundColor Gray
    }
    
    if (-not $corsOk -or -not $preflightOk) {
        Write-Host "   2. Add CORS policy to allow 'http://localhost' origin" -ForegroundColor White
        Write-Host "      See: BACKEND_FIX_QUICK_REFERENCE.md`n" -ForegroundColor Gray
    }
}

Write-Host "📄 Documentation:" -ForegroundColor Cyan
Write-Host "   - BACKEND_FIX_QUICK_REFERENCE.md (Quick fix)" -ForegroundColor White
Write-Host "   - BACKEND_CORS_FIX.md (Detailed guide)`n" -ForegroundColor White
