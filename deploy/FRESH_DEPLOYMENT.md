# 🚀 TechTorio - Fresh VM Deployment Guide

Complete deployment guide for setting up TechTorio on a brand new Google Cloud VM.

## 📋 Prerequisites

- Fresh Ubuntu 20.04/22.04 VM on Google Cloud
- VM with at least 2 vCPUs and 4GB RAM
- Static external IP address assigned
- Domain name (techtorio.online) ready

## 🔥 Quick Deploy (Automated)

**On the new VM**, run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/niaz2016/yaqeenpay/main/deploy/fresh-deploy.sh | bash
```

This will:
- ✅ Install Docker & Docker Compose
- ✅ Configure firewall (UFW)
- ✅ Clone the repository
- ✅ Generate secure credentials
- ✅ Build all Docker images
- ✅ Start all services
- ✅ Display access information

**Deployment takes ~10 minutes**

---

## 📖 Manual Deployment (Step-by-Step)

If you prefer manual control:

### 1. Connect to Your VM

```bash
# From GCP Console, use browser SSH
# Or use gcloud CLI:
gcloud compute ssh YOUR-VM-NAME --zone=YOUR-ZONE
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Install Git
sudo apt install -y git

# Log out and back in for Docker group to take effect
exit
# SSH back in
```

### 3. Configure Firewall

**Option A: Using UFW (Ubuntu Firewall)**
```bash
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # Alternative HTTP
sudo ufw status
```

**Option B: Using GCP Firewall (Recommended)**
```bash
# On your local machine with gcloud CLI:
gcloud compute firewall-rules create allow-web-all \
  --allow tcp:80,tcp:443,tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP/HTTPS traffic"
```

### 4. Clone Repository

```bash
cd ~
git clone https://github.com/niaz2016/yaqeenpay.git techtorio
cd techtorio
```

### 5. Create Environment File

```bash
# Copy example file
cp .env.cloud.example .env.cloud

# Edit with your values
nano .env.cloud
```

**Required values in `.env.cloud`:**
```bash
POSTGRES_PASSWORD=your_secure_db_password_here
SMS_BASE_URL=https://your-sms-service.com
SMS_SECRET_KEY=your_sms_secret_key
```

**Generate secure passwords:**
```bash
# For database password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25

# For SMS secret
openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
```

### 6. Build and Deploy

```bash
# Build all images (takes 5-10 minutes)
docker compose -f docker-compose.cloud.yml --env-file .env.cloud build --no-cache

# Start all services
docker compose -f docker-compose.cloud.yml --env-file .env.cloud up -d

# Check status
docker compose -f docker-compose.cloud.yml ps

# View logs
docker compose -f docker-compose.cloud.yml logs -f
```

### 7. Verify Deployment

```bash
# Check if services are running
docker ps

# Test locally
curl -I http://localhost:8080/escrow-market/

# Get your VM's external IP
curl ifconfig.me
```

### 8. Configure DNS

1. Go to your domain registrar (Namecheap)
2. Update DNS A record:
   - **Type**: A
   - **Host**: @ (or techtorio.online)
   - **Value**: YOUR-VM-EXTERNAL-IP
   - **TTL**: Automatic

3. Add www subdomain:
   - **Type**: A
   - **Host**: www
   - **Value**: YOUR-VM-EXTERNAL-IP
   - **TTL**: Automatic

4. Wait 5-10 minutes for DNS propagation

### 9. Access Your Application

**Direct IP Access:**
```
http://YOUR-VM-IP:8080/escrow-market/
```

**Domain Access (after DNS propagates):**
```
http://techtorio.online:8080/escrow-market/
```

**Default Admin Login:**
- Email: `admin@techtorio.com`
- Password: `Admin@123456`

---

## 🔧 Post-Deployment Tasks

### Change Admin Password

1. Login with default credentials
2. Go to Profile/Settings
3. Change password immediately

### Optional: Setup SSL with Cloudflare

1. Add site to Cloudflare
2. Update nameservers at Namecheap
3. Set SSL mode to "Flexible" in Cloudflare
4. Enable "Always Use HTTPS"
5. Set DNS records to "Proxied" (orange cloud)

### Monitor Services

```bash
# View all logs
docker compose -f docker-compose.cloud.yml logs -f

# View specific service logs
docker logs techtorio-backend -f
docker logs techtorio-frontend -f
docker logs techtorio-gateway -f
docker logs techtorio-postgres -f

# Check resource usage
docker stats
```

### Backup Database

```bash
# Create backup
docker exec techtorio-postgres pg_dump -U postgres TechTorio > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i techtorio-postgres psql -U postgres TechTorio < backup_20251119.sql
```

---

## 🛠️ Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.cloud.yml logs

# Rebuild from scratch
docker compose -f docker-compose.cloud.yml down -v
docker system prune -af
docker compose -f docker-compose.cloud.yml build --no-cache
docker compose -f docker-compose.cloud.yml up -d
```

### Can't Access from Browser

```bash
# Check if ports are open
sudo ufw status
ss -tulpn | grep -E ':(80|443|8080)'

# Test locally
curl -I http://localhost:8080/

# Check GCP firewall rules
gcloud compute firewall-rules list
```

### Database Issues

```bash
# Reset database
docker compose -f docker-compose.cloud.yml down
docker volume rm techtorio_postgres_data
docker compose -f docker-compose.cloud.yml up -d
```

### Frontend Not Loading

```bash
# Rebuild frontend only
docker compose -f docker-compose.cloud.yml build --no-cache frontend
docker compose -f docker-compose.cloud.yml up -d frontend

# Check nginx config
docker exec techtorio-gateway nginx -t
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────┐
│         Internet / Cloudflare           │
└────────────────┬────────────────────────┘
                 │ Port 80/8080
         ┌───────▼────────┐
         │  Nginx Gateway  │
         │  (techtorio)    │
         └────────┬────────┘
                  │
         ┌────────┴─────────────┐
         │                      │
    ┌────▼─────┐         ┌─────▼──────┐
    │ Frontend │         │  Backend   │
    │ (React)  │◄────────┤ (.NET 8)   │
    └──────────┘         └─────┬──────┘
                               │
                         ┌─────▼──────┐
                         │ PostgreSQL │
                         │ (Database) │
                         └────────────┘
```

---

## 🔒 Security Checklist

- [ ] Changed default admin password
- [ ] `.env.cloud` has strong passwords
- [ ] Firewall rules are restrictive
- [ ] SSH key-based authentication enabled
- [ ] Regular backups configured
- [ ] SSL/TLS enabled (via Cloudflare or Let's Encrypt)
- [ ] Database not exposed publicly
- [ ] Security headers enabled in nginx
- [ ] Rate limiting configured
- [ ] Logs monitored regularly

---

## 📚 Useful Commands

```bash
# Start services
docker compose -f docker-compose.cloud.yml up -d

# Stop services
docker compose -f docker-compose.cloud.yml down

# Restart specific service
docker compose -f docker-compose.cloud.yml restart backend

# View logs
docker compose -f docker-compose.cloud.yml logs -f [service]

# Update to latest code
cd ~/techtorio
git pull
docker compose -f docker-compose.cloud.yml up -d --build

# Check disk usage
docker system df

# Clean up old images
docker system prune -af

# Backup everything
tar -czf techtorio-backup-$(date +%Y%m%d).tar.gz ~/techtorio .env.cloud
```

---

## 🆘 Support

- **Repository**: https://github.com/niaz2016/yaqeenpay
- **Issues**: https://github.com/niaz2016/yaqeenpay/issues
- **Documentation**: See other `.md` files in the repo

---

**Last Updated**: November 19, 2025
