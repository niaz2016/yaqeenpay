# Generate RSA Key Pair for JWT Development
Add-Type -AssemblyName System.Security.Cryptography

$rsa = [System.Security.Cryptography.RSA]::Create(2048)

# Export private key as PKCS#8
$privateKeyBytes = $rsa.ExportPkcs8PrivateKey()
$privateKeyBase64 = [Convert]::ToBase64String($privateKeyBytes)

# Export public key as SubjectPublicKeyInfo
$publicKeyBytes = $rsa.ExportSubjectPublicKeyInfo()
$publicKeyBase64 = [Convert]::ToBase64String($publicKeyBytes)

Write-Host "Generated RSA Key Pair for JWT Development:"
Write-Host "=========================================="
Write-Host ""
Write-Host "Private Key (Base64 PKCS#8):"
Write-Host $privateKeyBase64
Write-Host ""
Write-Host "Public Key (Base64 SubjectPublicKeyInfo):"
Write-Host $publicKeyBase64
Write-Host ""
Write-Host "Copy these values to your appsettings.Development.json:"
Write-Host "  'PrivateKey': '$privateKeyBase64'"
Write-Host "  'PublicKey': '$publicKeyBase64'"