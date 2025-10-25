# DNS Verification Script for techtorio.online
# This script helps you verify if DNS is properly configured

param(
    [string]$Domain = "techtorio.online"
)

Write-Host "🔍 DNS Verification for $Domain" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan

$domains = @(
    $Domain,
    "api.$Domain",
    "admin.$Domain"
)

function Test-DomainDNS {
    param([string]$DomainName)
    
    Write-Host "`n📍 Testing: $DomainName" -ForegroundColor Yellow
    
    try {
        # Test DNS resolution
        $dnsResult = Resolve-DnsName -Name $DomainName -Type CNAME -ErrorAction SilentlyContinue
        
        if ($dnsResult) {
            $target = $dnsResult.NameHost
            Write-Host "   ✅ DNS Record Found" -ForegroundColor Green
            Write-Host "   🎯 Target: $target" -ForegroundColor White
            
            if ($target -like "*cfargotunnel.com") {
                Write-Host "   ✅ Correctly pointing to Cloudflare tunnel" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Not pointing to Cloudflare tunnel" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ No DNS record found" -ForegroundColor Red
            Write-Host "   🔧 Add CNAME record: niaz.cfargotunnel.com" -ForegroundColor Yellow
        }
        
        # Test HTTP connectivity
        Write-Host "   🌐 Testing HTTP connectivity..." -ForegroundColor Cyan
        try {
            $response = Invoke-WebRequest -Uri "https://$DomainName" -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
            Write-Host "   ✅ HTTPS accessible (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            if ($_.Exception.Message -like "*SSL*" -or $_.Exception.Message -like "*certificate*") {
                Write-Host "   ⚠️  SSL/Certificate issue - Cloudflare may still be setting up" -ForegroundColor Yellow
            } elseif ($_.Exception.Message -like "*timeout*") {
                Write-Host "   ⏱️  Timeout - DNS may still be propagating" -ForegroundColor Yellow
            } else {
                Write-Host "   ❌ Not accessible: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "   ❌ DNS resolution failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

foreach ($domain in $domains) {
    Test-DomainDNS -DomainName $domain
}

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "═══════════" -ForegroundColor Cyan
Write-Host "1. Ensure all domains have CNAME records pointing to: niaz.cfargotunnel.com" -ForegroundColor White
Write-Host "2. Enable Cloudflare proxy (orange cloud) for all records" -ForegroundColor White
Write-Host "3. DNS propagation can take 5-15 minutes" -ForegroundColor White
Write-Host "4. Check Cloudflare tunnel status: .\tunnel-manager.ps1 status" -ForegroundColor White

Write-Host "`n🎯 Expected URLs after setup:" -ForegroundColor Green
Write-Host "   - https://techtorio.online" -ForegroundColor Cyan
Write-Host "   - https://api.techtorio.online" -ForegroundColor Cyan
Write-Host "   - https://admin.techtorio.online" -ForegroundColor Cyan