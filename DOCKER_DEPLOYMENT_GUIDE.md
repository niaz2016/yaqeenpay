# Docker Deployment - Production Testing Guide

## Overview
This guide explains how to build and deploy updated Docker images for production testing after making code changes.

## Quick Start

### Option 1: Quick Rebuild (Recommended for Testing)
Use this when you've made code changes and want to test quickly:

```powershell
.\quick-rebuild.ps1
```

This script:
- Builds Docker images with cache (faster)
- Restarts all containers
- Shows container status
- Access URL: http://localhost

### Option 2: Full Build & Deploy
Use this for a complete rebuild from scratch:

```powershell
.\build-and-deploy.ps1
```

This script:
- Stops all containers
- Builds backend image from scratch
- Builds frontend image from scratch  
- Starts all containers
- Checks health status
- Shows detailed information
- Optionally views logs

## What Was Updated

### Latest Changes (Current Deployment)
1. **Email OTP Verification Fixes**
   - Fixed 404 error on email verification (using apiService instead of axios)
   - Fixed detailed error messages showing (username/email already taken)
   - Updated success message display in EmailOtpVerification component
   - Updated login error message from "verification link" to "verification code"

2. **Components Updated**
   - `EmailOtpVerification.tsx` - Now uses apiService with correct baseURL
   - `BuyerRegisterForm.tsx` - Success message moved to verification component
   - `api.ts` - Includes detailed errors array in error messages
   - `LoginCommand.cs` - Error message matches OTP-based system

## Docker Images

### Current Images
- **Backend**: `techtorio-backend:latest`
  - .NET 8 Runtime
  - ASP.NET Core API
  - Port: 8080 (internal)
  
- **Frontend**: `techtorio-frontend:latest`
  - Node 20 Alpine (build)
  - Nginx Alpine (runtime)
  - Port: 80

- **Database**: `postgres:15`
  - Port: 5432 (internal)

## Container Status

Check container status:
```powershell
docker ps --filter "name=techtorio"
```

Expected output:
```
NAMES                STATUS              PORTS
techtorio-backend    Up X minutes       8080/tcp
techtorio-frontend   Up X minutes       80/tcp
techtorio-postgres   Up X minutes       5432/tcp
```

## Accessing the Application

### Local Development
- **Frontend**: http://localhost
- **API**: http://localhost/api
- **Swagger**: http://localhost/api/swagger

### Production Server
- **Frontend**: https://techtorio.online/techtorio
- **API**: https://techtorio.online/techtorio/api
- **Swagger**: https://techtorio.online/techtorio/api/swagger

## Troubleshooting

### View Logs

All services:
```powershell
docker-compose logs -f
```

Backend only:
```powershell
docker logs -f techtorio-backend
```

Frontend only:
```powershell
docker logs -f techtorio-frontend
```

Database only:
```powershell
docker logs -f techtorio-postgres
```

### Container Not Starting

Check container status:
```powershell
docker inspect techtorio-backend
docker inspect techtorio-frontend
```

### Rebuild Without Cache

If you're having issues, rebuild without cache:
```powershell
docker-compose build --no-cache
docker-compose up -d
```

### Clean Start

Remove all containers and volumes:
```powershell
docker-compose down -v
docker-compose up -d
```

⚠️ **Warning**: This will delete the database!

## Testing the Deployment

### 1. Test Registration
1. Navigate to http://localhost/auth/register
2. Register a new buyer account
3. Should see success message: "Registration successful! We've sent a 6-digit verification code to..."
4. Check email for OTP
5. Enter OTP in verification page
6. Should NOT see 404 error ✓
7. Should redirect to login after successful verification

### 2. Test Error Messages
1. Try to register with existing email
2. Should see detailed errors:
   - "Username 'xxx' is already taken."
   - "Email 'xxx' is already taken."
3. NOT just "Failed to create user" ✓

### 3. Test Login Without Verification
1. Register but don't verify OTP
2. Try to login
3. Should see: "Please verify your email address before logging in. Check your inbox for the verification code." ✓

## Manual Docker Commands

### Build Images
```powershell
# Backend
docker build -t techtorio-backend:latest ./Backend

# Frontend  
docker build -t techtorio-frontend:latest ./Frontend
```

### Start/Stop Containers
```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Clean Up

Remove unused images:
```powershell
docker image prune -a
```

Remove unused volumes:
```powershell
docker volume prune
```

## Health Checks

### Backend Health
```powershell
curl http://localhost/api/health
```

### Frontend Health
```powershell
curl http://localhost
```

### Database Health
```powershell
docker exec techtorio-postgres pg_isready -U postgres
```

## Production Deployment

### Push to Registry (If Using)
```powershell
# Tag images
docker tag techtorio-backend:latest your-registry/techtorio-backend:latest
docker tag techtorio-frontend:latest your-registry/techtorio-frontend:latest

# Push images
docker push your-registry/techtorio-backend:latest
docker push your-registry/techtorio-frontend:latest
```

### Deploy to Production Server
```bash
# On production server
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

### Backend (.env or docker-compose.yml)
- `ASPNETCORE_ENVIRONMENT=Production`
- `ASPNETCORE_URLS=http://+:8080`
- `ConnectionStrings__DefaultConnection`

### Frontend (nginx.conf)
- API proxy: `/api` → `http://backend:8080`

## Files Created

- `build-and-deploy.ps1` - Full build and deployment script
- `quick-rebuild.ps1` - Quick rebuild for testing
- `DOCKER_DEPLOYMENT_GUIDE.md` - This file

## Summary

✅ Docker images updated with latest code changes
✅ Email OTP verification fixes deployed
✅ Error message improvements deployed
✅ Ready for production testing

**Next Steps**: Test the registration and verification flow to ensure all fixes are working correctly in the containerized environment.

---

**Last Updated**: 2025-11-03
**Build**: Latest
