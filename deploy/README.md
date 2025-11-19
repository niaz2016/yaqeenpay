# 📦 TechTorio Deployment Package

This folder contains all the automated deployment scripts and documentation for TechTorio.

---

## 📄 Files Overview

| File | Purpose |
|------|---------|
| `fresh-deploy.sh` | **Main deployment script** - Automated one-command deployment |
| `post-deploy-verify.sh` | Verification script to check deployment health |
| `FRESH_DEPLOYMENT.md` | Complete step-by-step deployment guide with manual instructions |

---

## 🚀 Quick Deploy (Recommended)

**For a fresh Ubuntu VM**, run this single command:

```bash
curl -fsSL https://raw.githubusercontent.com/niaz2016/yaqeenpay/main/deploy/fresh-deploy.sh | bash
```

This will automatically:
1. Update system packages
2. Install Docker & Docker Compose
3. Configure UFW firewall
4. Clone the repository
5. Generate secure credentials
6. Build Docker images
7. Start all services
8. Display access information

**Time**: ~10 minutes

---

## ✅ Verify Deployment

After deployment completes:

```bash
cd ~/techtorio/deploy
chmod +x post-deploy-verify.sh
./post-deploy-verify.sh
```

This checks:
- Docker service status
- Container health
- Database connectivity
- API & Frontend accessibility
- System resources

---

## 📖 Manual Deployment

If you prefer manual control, follow the comprehensive guide:

**See**: `FRESH_DEPLOYMENT.md`

It includes:
- Step-by-step instructions
- Firewall configuration
- DNS setup
- SSL/TLS configuration
- Troubleshooting guide
- Security checklist

---

## 🔧 What Gets Deployed

```
┌─────────────────────────────────────────┐
│         Internet / Cloudflare           │
└────────────────┬────────────────────────┘
                 │ Port 80/8080
         ┌───────▼────────┐
         │  Nginx Gateway  │
         │  (Port 8080)    │
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

### Containers

- **techtorio-postgres**: PostgreSQL 15 database
- **techtorio-backend**: .NET 8.0 ASP.NET Core API
- **techtorio-frontend**: React/Vue SPA
- **techtorio-gateway**: Nginx reverse proxy

### Ports

- **8080**: HTTP (Gateway → Internet)
- **5432**: PostgreSQL (Internal only)
- **80**: Frontend (Internal only)
- **8080**: Backend (Internal only)

---

## 🌐 Post-Deployment Steps

### 1. Access Your Application

```bash
# Get your external IP
curl ifconfig.me

# Access via browser
http://YOUR-IP:8080/escrow-market/
```

### 2. Login with Default Credentials

- **Email**: `admin@techtorio.com`
- **Password**: `Admin@123456`
- **⚠️ CHANGE THIS IMMEDIATELY**

### 3. Update DNS (Optional)

Point your domain to the VM's IP:
- Type: A
- Host: @
- Value: YOUR-VM-IP

### 4. Setup SSL (Optional)

Use Cloudflare for free SSL:
1. Add site to Cloudflare
2. Update nameservers
3. Set SSL mode to "Flexible"
4. Enable proxy (orange cloud)

---

## 🔐 Security

### Generated Credentials

The deployment script generates secure random passwords for:
- PostgreSQL database
- SMS service secret

These are saved in:
- `~/techtorio/.env.cloud`
- `~/techtorio/deployment-info.txt`

**⚠️ SAVE THESE IN A SECURE LOCATION**

### Important Files to Protect

Never commit or share:
- `.env.cloud` (contains passwords)
- `deployment-info.txt` (contains credentials)
- `jwt-keys/` (authentication keys)

### Security Checklist

- [ ] Change admin password
- [ ] Review `.env.cloud` credentials
- [ ] Setup SSH keys (disable password auth)
- [ ] Enable automatic security updates
- [ ] Configure database backups
- [ ] Setup log rotation
- [ ] Enable fail2ban (optional)

---

## 🛠️ Maintenance

### View Logs

```bash
cd ~/techtorio

# All services
docker compose -f docker-compose.cloud.yml logs -f

# Specific service
docker logs techtorio-backend -f
docker logs techtorio-frontend -f
docker logs techtorio-gateway -f
docker logs techtorio-postgres -f
```

### Restart Services

```bash
# All services
docker compose -f docker-compose.cloud.yml restart

# Specific service
docker compose -f docker-compose.cloud.yml restart backend
```

### Update Application

```bash
cd ~/techtorio
git pull
docker compose -f docker-compose.cloud.yml up -d --build
```

### Backup Database

```bash
# Create backup
docker exec techtorio-postgres pg_dump -U postgres TechTorio > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i techtorio-postgres psql -U postgres TechTorio < backup_20251119.sql
```

---

## 🧪 Testing

### Local Access Test

```bash
curl -I http://localhost:8080/escrow-market/
```

Expected: `HTTP/1.1 200 OK`

### External Access Test

From your local machine:
```bash
curl -I http://YOUR-VM-IP:8080/escrow-market/
```

### Health Checks

```bash
# Backend API (if implemented)
curl http://localhost:8080/api/health

# Database
docker exec techtorio-postgres pg_isready -U postgres

# Nginx config
docker exec techtorio-gateway nginx -t
```

---

## 🐛 Troubleshooting

### Containers Not Starting

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
# Check firewall
sudo ufw status

# Check if ports are open
ss -tulpn | grep -E ':(80|8080)'

# Test locally
curl -I http://localhost:8080/
```

### Database Connection Issues

```bash
# Check database logs
docker logs techtorio-postgres

# Check if database is ready
docker exec techtorio-postgres pg_isready -U postgres

# Restart database
docker compose -f docker-compose.cloud.yml restart postgres
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart memory-intensive service
docker compose -f docker-compose.cloud.yml restart backend

# Prune unused Docker resources
docker system prune -a
```

---

## 📚 Additional Documentation

- **Quick Start**: `../QUICKSTART.md`
- **Full Guide**: `FRESH_DEPLOYMENT.md`
- **Security**: `../SECURITY.md`
- **Docker Guide**: `../DOCKER_DEPLOYMENT.md`

---

## 🔗 Links

- **Repository**: https://github.com/niaz2016/yaqeenpay
- **Issues**: https://github.com/niaz2016/yaqeenpay/issues

---

## 📝 Notes

### System Requirements

- **OS**: Ubuntu 20.04/22.04 LTS
- **CPU**: 2+ vCPUs
- **RAM**: 4+ GB
- **Disk**: 20+ GB SSD
- **Network**: Static IP, open ports 80, 443, 8080

### Port Requirements

The deployment requires these ports to be open:
- **22**: SSH access
- **80**: HTTP (optional)
- **443**: HTTPS (optional, for direct SSL)
- **8080**: Primary HTTP access

### Known Issues

1. **GCP E2 Port Blocking**: Some GCP instances may have additional network restrictions beyond visible firewall rules
2. **Browser Caching**: Clear cache after deployment (Ctrl+F5)
3. **DNS Propagation**: Can take up to 24 hours in some cases

---

## 🤝 Contributing

If you find issues or want to improve the deployment scripts:

1. Test your changes on a fresh VM
2. Update documentation
3. Submit a pull request

---

**Last Updated**: November 19, 2025

**Script Version**: 1.0
