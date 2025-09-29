# JWT (RSA) and OTP (Redis) setup

This API now uses RSA (RS256) for JWT signing and Redis for OTP storage.

## 1) Generate RSA keys

Run these commands on any machine with OpenSSL installed (PowerShell shown):

```powershell
# Private key (PKCS#8 PEM)
openssl genrsa -out jwt.key 2048
openssl pkcs8 -topk8 -inform PEM -outform DER -in jwt.key -out jwt-private.der -nocrypt

# Public key (SubjectPublicKeyInfo)
openssl rsa -in jwt.key -pubout -outform DER -out jwt-public.der

# Base64 encode for appsettings
[Convert]::ToBase64String([IO.File]::ReadAllBytes("jwt-private.der"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes("jwt-public.der"))
```

Copy the Base64 strings into appsettings under JwtSettings:PrivateKey and JwtSettings:PublicKey.

- PrivateKey expects Base64 PKCS#8 (DER) bytes
- PublicKey expects Base64 SubjectPublicKeyInfo (DER) bytes

Optionally set a KeyId (kid) for future key rotation.

## 2) Configure Redis

Set Redis:ConnectionString in appsettings. Default is `localhost:6379`.

## 3) Phone verification endpoints

- POST /api/profile/verify-phone/request
  - Sends an OTP to the user's phone via the Outbox (type="sms").
- POST /api/profile/verify-phone/confirm { otp }
  - Validates OTP and marks PhoneNumberConfirmed + PhoneVerifiedAt.

Note: An Outbox dispatcher to deliver SMS messages should be implemented separately.
