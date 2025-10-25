# Simple DNS Check for techtorio.online
param([string]$Domain = "techtorio.online")

Write-Host "Checking DNS for $Domain" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Check nameservers
try {
    $ns = Resolve-DnsName $Domain -Type NS -ErrorAction Stop
    Write-Host "Nameservers found:" -ForegroundColor Green
    foreach ($server in $ns) {
        Write-Host "  - $($server.NameHost)" -ForegroundColor White
    }
} catch {
    Write-Host "No nameservers found - Domain may not be configured yet" -ForegroundColor Red
}

# Check CNAME records
$subdomains = @("", "api.", "admin.")
foreach ($sub in $subdomains) {
    $testDomain = "$sub$Domain"
    if ($sub -eq "") { $testDomain = $Domain }
    
    try {
        $cname = Resolve-DnsName $testDomain -Type CNAME -ErrorAction SilentlyContinue
        if ($cname) {
            Write-Host "$testDomain -> $($cname.NameHost)" -ForegroundColor Green
        } else {
            Write-Host "$testDomain - No CNAME record" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "$testDomain - Not configured" -ForegroundColor Red
    }
}