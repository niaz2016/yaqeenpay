# 🚀 TechTorio - Quick Start Guide

**Deploy TechTorio in 5 minutes on a fresh GCP VM**

---

## Prerequisites

- Fresh Ubuntu 20.04/22.04 VM on Google Cloud
- At least 2 vCPUs and 4GB RAM
- Static external IP assigned
- SSH access to the VM

---

## 🔥 One-Command Deployment

SSH into your fresh VM and run:

```bash
curl -fsSL https://raw.githubusercontent.com/niaz2016/yaqeenpay/main/deploy/fresh-deploy.sh | bash
```

**That's it!** The script will:
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Clone the repository
- ✅ Generate secure credentials
- ✅ Build Docker images
- ✅ Start all services

**Deployment takes ~10 minutes**

---

## 📋 What Gets Installed

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **PostgreSQL** | `techtorio-postgres` | 5432 | Database |
| **Backend API** | `techtorio-backend` | 8080 | .NET 8.0 API |
| **Frontend** | `techtorio-frontend` | 80 | React/Vue SPA |
| **Nginx Gateway** | `techtorio-gateway` | 8080 | Reverse Proxy |

---

## ✅ Verify Deployment

After deployment completes, run:

```bash
cd ~/techtorio
./deploy/post-deploy-verify.sh
```

This checks:
- ✓ Docker service status
- ✓ Container health
- ✓ Database connectivity
- ✓ API responsiveness
- ✓ Frontend accessibility
- ✓ Nginx configuration
- ✓ System resources

---

## 🌐 Access Your Application

**Get Your External IP:**
```bash
curl ifconfig.me
```

**Access URLs:**
- `http://YOUR-IP:8080/escrow-market/`
- `http://techtorio.online:8080/escrow-market/` (after DNS setup)

**Default Admin Login:**
- Email: `admin@techtorio.com`
- Password: `Admin@123456`
- **⚠️ CHANGE THIS IMMEDIATELY**

---

## 🔧 Common Commands

```bash
# Navigate to project directory
cd ~/techtorio

# View all logs
docker compose -f docker-compose.cloud.yml logs -f

# View specific service logs
docker logs techtorio-backend -f
docker logs techtorio-frontend -f
docker logs techtorio-gateway -f

# Restart all services
docker compose -f docker-compose.cloud.yml restart

# Restart specific service
docker compose -f docker-compose.cloud.yml restart backend

# Stop all services
docker compose -f docker-compose.cloud.yml down

# Start all services
docker compose -f docker-compose.cloud.yml up -d

# Check status
docker compose -f docker-compose.cloud.yml ps

# Update to latest code
git pull
docker compose -f docker-compose.cloud.yml up -d --build
```

---

## 🌐 DNS Setup

1. Go to your domain registrar (e.g., Namecheap, GoDaddy)
2. Add/Update A record:
   - **Type**: A
   - **Host**: @
   - **Value**: YOUR-VM-IP
   - **TTL**: Automatic

3. Add www subdomain:
   - **Type**: A
   - **Host**: www
   - **Value**: YOUR-VM-IP
   - **TTL**: Automatic

4. Wait 5-10 minutes for DNS propagation

---

## 🔒 Optional: Cloudflare SSL

1. Add site to Cloudflare (free plan)
2. Change nameservers at your registrar to Cloudflare's
3. In Cloudflare:
   - SSL/TLS → Overview → Set to **Flexible**
   - SSL/TLS → Edge Certificates → Enable **Always Use HTTPS**
   - DNS → Set records to **Proxied** (orange cloud)

---

## 🛠️ Troubleshooting

### Can't Access from Browser?

```bash
# Check firewall
sudo ufw status

# Test locally
curl -I http://localhost:8080/

# Check container logs
docker compose -f docker-compose.cloud.yml logs
```

### Services Not Starting?

```bash
# Rebuild from scratch
docker compose -f docker-compose.cloud.yml down -v
docker system prune -af
docker compose -f docker-compose.cloud.yml build --no-cache
docker compose -f docker-compose.cloud.yml up -d
```

### Database Issues?

```bash
# Reset database
docker compose -f docker-compose.cloud.yml down
docker volume rm techtorio_postgres_data
docker compose -f docker-compose.cloud.yml up -d
```

---

## 📊 Resource Monitoring

```bash
# Check container resource usage
docker stats

# Check disk space
df -h

# Check memory
free -h

# Check logs size
du -sh ~/techtorio/log/
```

---

## 🔐 Security Checklist

After deployment:

- [ ] Change admin password
- [ ] Review generated credentials in `.env.cloud`
- [ ] Setup SSH key authentication
- [ ] Disable password SSH login
- [ ] Enable automatic security updates
- [ ] Setup database backups
- [ ] Enable Cloudflare SSL (optional)

---

## 📚 Documentation

- **Full Deployment Guide**: `deploy/FRESH_DEPLOYMENT.md`
- **Security Guide**: `SECURITY.md`
- **Repository**: https://github.com/niaz2016/yaqeenpay

---

## 🆘 Need Help?

1. Check logs: `docker compose logs -f`
2. Run verification: `./deploy/post-deploy-verify.sh`
3. Review documentation in `deploy/` folder
4. Open issue on GitHub

---

**Last Updated**: November 19, 2025

**Deployment Script Version**: 1.0
