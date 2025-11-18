# Quick Deployment Guide - GCP Instance 34.61.87.121

## You're Almost There! 

All deployment files are ready and pushed to GitHub. Since you're using browser SSH (which is perfect), follow these simple steps:

## Option 1: One-Command Deployment (Recommended)

1. **Open browser SSH to your instance** (via GCP Console)

2. **Run these commands:**
```bash
# Clone and deploy
cd /opt && sudo rm -rf techtorio && sudo git clone https://github.com/niaz2016/yaqeenpay.git techtorio && sudo chown -R $(whoami):$(whoami) techtorio && cd techtorio && bash deploy/deploy-to-cloud.sh
```

**Alternative if repo is private, use manual steps below (Option 2)**

That's it! The script will:
- ✓ Verify Docker
- ✓ Update system packages
- ✓ Configure firewall (ports 22, 80, 443)
- ✓ Clone the repository
- ✓ Generate secure database password
- ✓ Build all Docker images
- ✓ Start all services
- ✓ Show you the status

**Time:** 5-10 minutes for Docker builds

---

## Option 2: Manual Step-by-Step

If you prefer to see each step:

### 1. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/niaz2016/yaqeenpay.git techtorio
sudo chown ubuntu:ubuntu techtorio
cd techtorio
```

### 2. Setup Environment
```bash
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)

# Create .env file
cp .env.cloud .env
sed -i "s/YourStrongPasswordHere123!/$DB_PASSWORD/" .env

# Verify
cat .env
```

### 3. Configure Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable
sudo ufw status
```

### 4. Deploy
```bash
docker compose -f docker-compose.cloud.yml build
docker compose -f docker-compose.cloud.yml up -d
```

### 5. Verify
```bash
docker compose -f docker-compose.cloud.yml ps
docker logs techtorio-backend --tail=50
docker logs techtorio-gateway --tail=50
curl http://localhost
```

---

## After Deployment

### Access Your App
```
http://34.61.87.121
```

### Check Status
```bash
cd /opt/techtorio
docker compose -f docker-compose.cloud.yml ps
docker compose -f docker-compose.cloud.yml logs -f
```

### Useful Commands
```bash
# View logs
docker logs techtorio-backend -f
docker logs techtorio-gateway -f
docker logs techtorio-frontend -f
docker logs techtorio-postgres -f

# Restart a service
docker compose -f docker-compose.cloud.yml restart backend

# Restart all
docker compose -f docker-compose.cloud.yml restart

# Stop all
docker compose -f docker-compose.cloud.yml down

# Update and redeploy
git pull
docker compose -f docker-compose.cloud.yml up -d --build
```

### Resource Monitoring
```bash
# Container stats
docker stats

# System resources
htop
free -h
df -h
```

---

## Troubleshooting

### Backend not starting?
```bash
docker logs techtorio-backend --tail=100
# Check database connection in .env
```

### Gateway 502 error?
```bash
# Check if backend is responding
docker exec techtorio-gateway curl -v http://backend:8080/api/health
```

### Port already in use?
```bash
sudo ss -tulpn | grep :80
# Kill the process or change port in docker-compose.cloud.yml
```

### Out of memory?
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Next Steps (Optional but Recommended)

### 1. Enable Auto-Start
Create `/etc/systemd/system/techtorio.service`:
```ini
[Unit]
Description=TechTorio Docker Stack
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/techtorio
ExecStart=/usr/bin/docker compose -f docker-compose.cloud.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.cloud.yml down

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable techtorio
```

### 2. Setup SSL/HTTPS (when you have a domain)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Update gateway nginx config to use SSL
# Then restart: docker compose restart gateway
```

### 3. Automatic Security Updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. Database Backups
```bash
# Manual backup
docker exec techtorio-postgres pg_dump -U postgres TechTorio > backup-$(date +%F).sql

# Automated daily backup (crontab)
crontab -e
# Add: 0 2 * * * docker exec techtorio-postgres pg_dump -U postgres TechTorio > /backup/db-$(date +\%F).sql
```

---

## Important Notes

✓ **Firewall**: UFW configured with ports 22, 80, 443 open
✓ **Database**: Secure random password generated (check `.env`)
✓ **No Mailserver**: Excluded to save resources on E2 instance
✓ **Environment**: Production mode with optimizations
✓ **Volumes**: Data persists in Docker volumes (survives container restarts)

## Support

For detailed documentation, see:
- Full guide: `/opt/techtorio/deploy/CLOUD_DEPLOYMENT.md`
- Docker compose: `/opt/techtorio/docker-compose.cloud.yml`

Questions? Check logs first:
```bash
docker compose -f docker-compose.cloud.yml logs
```
