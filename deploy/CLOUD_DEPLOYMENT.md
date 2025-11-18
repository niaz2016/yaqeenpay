# TechTorio Cloud Deployment Guide

## Server: 34.61.87.121 (Google Cloud E2)

### Prerequisites
- Docker and Docker Compose installed ✓
- SSH access configured
- UFW firewall ready

## Step 1: Verify Docker Installation

```bash
docker version
docker info
docker compose version
```

If `docker compose` missing:
```bash
sudo apt update
sudo apt install docker-compose-plugin -y
```

## Step 2: Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y git curl htop jq wget ufw

# Set timezone
sudo timedatectl set-timezone UTC

# Optional: Add swap (2GB for E2 small instance)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Step 3: Configure Firewall

```bash
# Set defaults
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow essential ports
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status verbose
```

**Important**: Also ensure GCP VPC firewall rules allow:
- tcp:22 (SSH)
- tcp:80 (HTTP)
- tcp:443 (HTTPS when ready)

## Step 4: Clone Repository

```bash
# Create deployment directory
sudo mkdir -p /opt/techtorio
sudo chown $USER:$USER /opt/techtorio

# Clone repository
cd /opt
git clone https://github.com/niaz2016/yaqeenpay.git techtorio
cd techtorio
git checkout main
```

## Step 5: Configure Environment

```bash
# Copy and edit environment file
cp .env.cloud .env
nano .env
```

**Critical**: Change `POSTGRES_PASSWORD` to a strong random password:
```bash
# Generate a secure password
openssl rand -base64 32
```

Update `.env`:
```env
POSTGRES_PASSWORD=<your-generated-password>
SMS_BASE_URL=http://your-sms-service
SMS_SECRET_KEY=<your-sms-key>
```

## Step 6: Build and Deploy

```bash
# Build all images (will take 5-10 minutes)
docker compose -f docker-compose.cloud.yml build

# Start services
docker compose -f docker-compose.cloud.yml up -d

# Check status
docker compose -f docker-compose.cloud.yml ps
```

## Step 7: Verify Deployment

```bash
# Check logs
docker logs techtorio-backend --tail=50
docker logs techtorio-frontend --tail=50
docker logs techtorio-gateway --tail=50
docker logs techtorio-postgres --tail=50

# Test endpoints
curl -i http://localhost
curl -i http://localhost/api/health

# Test from external
curl -i http://34.61.87.121
```

## Step 8: Database Initialization

If database needs seeding:
```bash
# Access postgres
docker exec -it techtorio-postgres psql -U postgres -d TechTorio

# Check tables
\dt

# Run migrations if needed
docker exec -it techtorio-backend dotnet ef database update
```

## Step 9: Enable Auto-Start (Systemd)

Create `/etc/systemd/system/techtorio.service`:
```ini
[Unit]
Description=TechTorio Docker Compose Stack
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/techtorio
ExecStart=/usr/bin/docker compose -f docker-compose.cloud.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.cloud.yml down
User=root

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable techtorio
sudo systemctl start techtorio
systemctl status techtorio
```

## Step 10: Monitoring and Maintenance

### View logs
```bash
docker compose -f docker-compose.cloud.yml logs -f
docker compose -f docker-compose.cloud.yml logs -f backend
```

### Restart services
```bash
docker compose -f docker-compose.cloud.yml restart
docker compose -f docker-compose.cloud.yml restart backend
```

### Update deployment
```bash
cd /opt/techtorio
git pull
docker compose -f docker-compose.cloud.yml build
docker compose -f docker-compose.cloud.yml up -d
```

### Backup database
```bash
docker exec techtorio-postgres pg_dump -U postgres TechTorio > backup-$(date +%F).sql
```

### Check resource usage
```bash
docker stats
htop
df -h
```

## Troubleshooting

### Backend not starting
```bash
docker logs techtorio-backend --tail=100
# Check connection string in .env
# Ensure postgres is healthy: docker ps
```

### Gateway 502 errors
```bash
# Check if backend is responding
docker exec techtorio-gateway curl -v http://backend:8080/api/health
```

### Port already in use
```bash
# Find process using port 80
sudo lsof -i :80
# Or
sudo ss -tulpn | grep :80
```

### Out of disk space
```bash
# Clean unused Docker resources
docker system prune -a --volumes
```

## Security Hardening

### 1. Enable automatic security updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

### 2. Disable password authentication (key-only)
Edit `/etc/ssh/sshd_config`:
```
PasswordAuthentication no
PermitRootLogin no
```
Then: `sudo systemctl reload sshd`

### 3. Install fail2ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular backups
Setup cron job for daily backups:
```bash
crontab -e
```
Add:
```
0 2 * * * docker exec techtorio-postgres pg_dump -U postgres TechTorio > /backup/techtorio-$(date +\%F).sql
```

## Next Steps

1. **SSL/TLS**: Setup Let's Encrypt certificates
2. **Domain**: Point your domain to 34.61.87.121
3. **Monitoring**: Setup uptime monitoring
4. **CDN**: Consider Cloudflare for DDoS protection
5. **Backups**: Automate database and volume backups

## Support

For issues, check:
- Container logs: `docker logs <container-name>`
- System logs: `journalctl -xe`
- Disk space: `df -h`
- Memory: `free -h`
