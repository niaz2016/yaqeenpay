# PowerShell script to rebuild APK for TechTorio
# This ensures clean build with correct environment variables

Write-Host "🔧 TechTorio APK Rebuild Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your API URL" -ForegroundColor Yellow
    exit 1
}

# Step 2: Show current API URL configuration
Write-Host "📝 Current API Configuration:" -ForegroundColor Green
$apiUrl = Select-String -Path ".env.production" -Pattern "VITE_API_URL" | Select-Object -First 1
Write-Host $apiUrl -ForegroundColor White
Write-Host ""

# Step 3: Get local IP address
Write-Host "💻 Your Local Network IP Addresses:" -ForegroundColor Green
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch "^127\." } | Select-Object -ExpandProperty IPAddress
foreach ($ip in $ips) {
    Write-Host "   $ip" -ForegroundColor White
}
Write-Host ""

# Prompt to continue
Write-Host "⚠️  Make sure:" -ForegroundColor Yellow
Write-Host "   1. Backend is running on the IP:Port specified above" -ForegroundColor White
Write-Host "   2. Your mobile device is on the same WiFi network" -ForegroundColor White
Write-Host "   3. Windows Firewall allows connections on backend port" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Continue with rebuild? (Y/N)"
if ($continue -ne "Y" -and $continue -ne "y") {
    Write-Host "❌ Rebuild cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🧹 Step 1: Cleaning previous build..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
    Write-Host "   ✓ Cleaned dist folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔨 Step 2: Building production bundle..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Build completed" -ForegroundColor Green

Write-Host ""
Write-Host "📱 Step 3: Syncing with Capacitor..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Sync completed" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Build complete! Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1 - Build APK in Android Studio:" -ForegroundColor Yellow
Write-Host "   npx cap open android" -ForegroundColor White
Write-Host "   Then: Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Build APK via command line:" -ForegroundColor Yellow
Write-Host "   cd android" -ForegroundColor White
Write-Host "   .\gradlew assembleDebug" -ForegroundColor White
Write-Host "   APK will be in: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "Option 3 - Install directly to connected device:" -ForegroundColor Yellow
Write-Host "   adb install android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""

# Ask if user wants to open Android Studio
$openStudio = Read-Host "Open Android Studio now? (Y/N)"
if ($openStudio -eq "Y" -or $openStudio -eq "y") {
    Write-Host "🚀 Opening Android Studio..." -ForegroundColor Cyan
    npx cap open android
}

Write-Host ""
Write-Host "🎉 Done!" -ForegroundColor Green
