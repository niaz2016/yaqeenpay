# Add Subdomain Migration and Update Database
# Run this script from the Backend directory

Write-Host "Adding Subdomain migration..." -ForegroundColor Cyan

# Navigate to Infrastructure project
Set-Location "YaqeenPay.Infrastructure"

# Add migration
dotnet ef migrations add AddSubdomainTable `
    --startup-project ..\YaqeenPay.API\YaqeenPay.API.csproj `
    --context ApplicationDbContext `
    --output-dir Persistence/Migrations

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration added successfully!" -ForegroundColor Green
    
    Write-Host "`nUpdating database..." -ForegroundColor Cyan
    
    # Update database
    dotnet ef database update `
        --startup-project ..\YaqeenPay.API\YaqeenPay.API.csproj `
        --context ApplicationDbContext
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error updating database!" -ForegroundColor Red
    }
} else {
    Write-Host "Error adding migration!" -ForegroundColor Red
}

# Return to Backend directory
Set-Location ..

Write-Host "`nDone!" -ForegroundColor Cyan
