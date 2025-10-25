# 🚀 YaqeenPay on techtorio.online - Quick Start Guide

## Step 1: Copy Cloudflare Configuration
Copy the content from `cloudflare-config.yml` to `C:\Users\Precision\.cloudflared\config.yml`

## Step 2: Set up DNS in Cloudflare Dashboard
Go to Cloudflare Dashboard → techtorio.online → DNS

Add these CNAME records:

### Main Domain
- **Type:** CNAME
- **Name:** @ (or blank for root domain)
- **Target:** niaz.cfargotunnel.com
- **Proxy:** ✅ Enabled (Orange cloud)

### API Subdomain
- **Type:** CNAME
- **Name:** api
- **Target:** niaz.cfargotunnel.com
- **Proxy:** ✅ Enabled (Orange cloud)

### Admin Subdomain
- **Type:** CNAME
- **Name:** admin
- **Target:** niaz.cfargotunnel.com
- **Proxy:** ✅ Enabled (Orange cloud)

## Step 3: Start Your Application
```powershell
# Start Docker containers
docker-compose up -d

# Start Cloudflare tunnel
.\tunnel-manager.ps1 start
```

## Step 4: Verify Everything Works
```powershell
# Check Docker status
docker-compose ps

# Check tunnel status
.\tunnel-manager.ps1 status

# Test DNS configuration
.\verify-dns.ps1
```

## Your URLs After Setup:
- 🌍 **Main Site:** https://techtorio.online
- 🔧 **API:** https://api.techtorio.online
- 👨‍💼 **Admin:** https://admin.techtorio.online
- 🏠 **Local:** http://localhost:8080

## Troubleshooting Commands:
```powershell
# Stop tunnel
.\tunnel-manager.ps1 stop

# Check logs
docker-compose logs

# Restart everything
docker-compose down && docker-compose up -d
.\tunnel-manager.ps1 start
```

## Notes:
- DNS propagation may take 5-15 minutes
- All subdomains point to the same application (localhost:8080)
- Your app handles routing internally
- HTTPS is automatically provided by Cloudflare