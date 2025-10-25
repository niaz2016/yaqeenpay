# TechTorio Deployment Guide - Step by Step
# Server: 16.170.233.86
# Domain: techtorio.online

## Step 1: Configure DNS First (Do this before continuing)

Go to your domain registrar (where you bought techtorio.online) and add these DNS records:

```
Type    Name                    Value               TTL
A       @                       16.170.233.86       300
A       www                     16.170.233.86       300
A       yaqeenpay               16.170.233.86       300
A       api                     16.170.233.86       300
A       status                  16.170.233.86       300
A       *                       16.170.233.86       300  (wildcard - optional)
```

Wait 5-10 minutes for DNS propagation.

## Step 2: Test DNS Resolution

Open PowerShell and run:
```powershell
nslookup techtorio.online
nslookup www.techtorio.online
```

Should return: 16.170.233.86

## Step 3: Connect to Server

```powershell
ssh -i "C:\Users\Precision\Downloads\firstKey.pem" ubuntu@16.170.233.86
```

## Step 4: Initial Server Setup

Once connected, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
rm get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Install essential tools
sudo apt install -y git curl wget nginx certbot python3-certbot-nginx ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 5: Create Directory Structure

```bash
# Create main directory
sudo mkdir -p /opt/techtorio
sudo chown -R ubuntu:ubuntu /opt/techtorio
cd /opt/techtorio

# Create subdirectories
mkdir -p nginx/conf.d nginx/ssl gateway/html database/init logs
```

## Step 6: Copy Files from Local Machine

On your local Windows machine, open a NEW PowerShell window and run:

```powershell
# Navigate to your project
cd "D:\Work Repos\AI\yaqeenpay"

# Copy gateway files (landing page)
scp -i "C:\Users\Precision\Downloads\firstKey.pem" -r gateway/html/* ubuntu@16.170.233.86:/opt/techtorio/gateway/html/

# Copy environment file
scp -i "C:\Users\Precision\Downloads\firstKey.pem" .env.production.example ubuntu@16.170.233.86:/opt/techtorio/.env

# Or use Git (recommended)
# First, commit and push your changes to GitHub
# Then on server: git clone https://github.com/niaz2016/yaqeenpay.git /opt/techtorio
```

## Step 7: Create Nginx Configuration (on server)

```bash
cd /opt/techtorio

# Create main nginx config for landing page
cat > nginx/techtorio.conf << 'EOF'
server {
    listen 80;
    server_name techtorio.online www.techtorio.online;

    root /opt/techtorio/gateway/html;
    index index.html;

    # Logging
    access_log /opt/techtorio/logs/access.log;
    error_log /opt/techtorio/logs/error.log;

    location / {
        try_files $uri $uri/ =404;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Copy to nginx sites-available
sudo cp nginx/techtorio.conf /etc/nginx/sites-available/techtorio.conf

# Enable the site
sudo ln -s /etc/nginx/sites-available/techtorio.conf /etc/nginx/sites-enabled/

# Remove default nginx config
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

## Step 8: Test the Landing Page

Open your browser and visit: http://techtorio.online

You should see the TechTorio landing page!

## Step 9: Setup SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d techtorio.online -d www.techtorio.online

# Follow prompts:
# - Enter your email
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

## Step 10: Verify HTTPS

Visit: https://techtorio.online

Should show secure connection with the landing page!

## Troubleshooting

If landing page doesn't show:

```bash
# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check if files exist
ls -la /opt/techtorio/gateway/html/

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

If DNS not working:
```bash
# Check DNS resolution from server
dig techtorio.online
nslookup techtorio.online
```

## Next Steps (After Landing Page Works)

1. Deploy YaqeenPay backend and frontend using Docker
2. Configure database
3. Setup automated backups
4. Configure monitoring

## Quick Commands Reference

```bash
# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx

# Check firewall status
sudo ufw status

# Check what's listening on port 80
sudo netstat -tlnp | grep :80
```
