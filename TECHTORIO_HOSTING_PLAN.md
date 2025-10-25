# TechTorio Multi-Application Hosting & Management Plan

## Architecture Overview

### Current Setup
- **Main Gateway**: Landing page at `techtorio.online`
- **YaqeenPay**: First application
- **Future Apps**: Scalable infrastructure for multiple applications

## Recommended Architecture

### 1. **Reverse Proxy Architecture (Nginx Gateway)**

```
Internet → Nginx (Gateway/Reverse Proxy) → Individual Applications
                                          → YaqeenPay
                                          → App2
                                          → App3
```

#### Benefits:
- Single entry point for all applications
- Centralized SSL/TLS management
- Load balancing capabilities
- Easy to add new applications
- URL-based routing

### 2. **URL Structure**

```
https://techtorio.online/              → Main landing page (gateway)
https://techtorio.online/yaqeenpay/    → YaqeenPay application
https://techtorio.online/app2/         → Future App 2
https://techtorio.online/app3/         → Future App 3

OR (Recommended for production)

https://techtorio.online/              → Main landing page
https://yaqeenpay.techtorio.online/    → YaqeenPay (subdomain)
https://app2.techtorio.online/         → Future App 2
https://app3.techtorio.online/         → Future App 3
```

### 3. **Docker-Based Architecture** (Recommended)

#### File Structure:
```
/opt/techtorio/
├── docker-compose.yml              # Orchestrates all services
├── nginx/
│   ├── nginx.conf                  # Main nginx config
│   ├── conf.d/
│   │   ├── gateway.conf           # Landing page config
│   │   ├── yaqeenpay.conf         # YaqeenPay routing
│   │   └── app-template.conf      # Template for new apps
│   └── ssl/                        # SSL certificates
├── gateway/
│   ├── html/                       # Your current landing page
│   └── Dockerfile
├── yaqeenpay/
│   ├── backend/
│   │   └── Dockerfile
│   └── frontend/
│       └── Dockerfile
├── app2/                           # Future app
└── shared/
    ├── database/                   # Shared PostgreSQL
    └── redis/                      # Shared cache

```

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1-2)

#### Step 1: Server Preparation
```bash
# Server requirements
- VPS/Cloud Server (DigitalOcean, AWS, Azure, etc.)
- Ubuntu 22.04 LTS or similar
- Minimum: 4GB RAM, 2 CPUs, 50GB SSD
- Recommended: 8GB RAM, 4 CPUs, 100GB SSD
```

#### Step 2: Install Dependencies
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin

# Install Nginx (optional, if not using Docker)
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

#### Step 3: Domain & DNS Configuration
```
Main Domain: techtorio.online → Server IP
*.techtorio.online (Wildcard) → Server IP

Or individual records:
www.techtorio.online → Server IP
yaqeenpay.techtorio.online → Server IP
status.techtorio.online → Server IP
```

### Phase 2: Gateway & Nginx Setup (Week 2)

#### Create Master docker-compose.yml
```yaml
version: '3.8'

services:
  # Nginx Gateway (Reverse Proxy)
  nginx-gateway:
    image: nginx:alpine
    container_name: techtorio-gateway
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./gateway/html:/usr/share/nginx/html/gateway:ro
    depends_on:
      - yaqeenpay-backend
      - yaqeenpay-frontend
    networks:
      - techtorio-network
    restart: unless-stopped

  # PostgreSQL (Shared Database)
  postgres:
    image: postgres:15-alpine
    container_name: techtorio-postgres
    environment:
      POSTGRES_USER: techtorio_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: techtorio_main
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - techtorio-network
    restart: unless-stopped

  # Redis (Shared Cache)
  redis:
    image: redis:7-alpine
    container_name: techtorio-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - techtorio-network
    restart: unless-stopped

  # YaqeenPay Backend
  yaqeenpay-backend:
    build: ./yaqeenpay/backend
    container_name: yaqeenpay-api
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=yaqeenpay;Username=techtorio_admin;Password=${DB_PASSWORD}
      - Redis__Connection=redis:6379,password=${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    networks:
      - techtorio-network
    restart: unless-stopped

  # YaqeenPay Frontend
  yaqeenpay-frontend:
    build: ./yaqeenpay/frontend
    container_name: yaqeenpay-web
    depends_on:
      - yaqeenpay-backend
    networks:
      - techtorio-network
    restart: unless-stopped

  # Future App Template (commented out)
  # app2-backend:
  #   build: ./app2/backend
  #   container_name: app2-api
  #   ...

networks:
  techtorio-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

#### Nginx Gateway Configuration
```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;
    
    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# nginx/conf.d/gateway.conf - Main landing page
server {
    listen 80;
    server_name techtorio.online www.techtorio.online;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name techtorio.online www.techtorio.online;
    
    ssl_certificate /etc/nginx/ssl/techtorio.crt;
    ssl_certificate_key /etc/nginx/ssl/techtorio.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /usr/share/nginx/html/gateway;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```nginx
# nginx/conf.d/yaqeenpay.conf - YaqeenPay application
server {
    listen 80;
    server_name yaqeenpay.techtorio.online;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yaqeenpay.techtorio.online;
    
    ssl_certificate /etc/nginx/ssl/techtorio.crt;
    ssl_certificate_key /etc/nginx/ssl/techtorio.key;
    
    # Frontend
    location / {
        proxy_pass http://yaqeenpay-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://yaqeenpay-backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Phase 3: Database Management (Week 3)

#### Database Strategy

**Option 1: Single Shared Database (Simple)**
```sql
-- All apps in one PostgreSQL instance, different databases
CREATE DATABASE yaqeenpay;
CREATE DATABASE app2;
CREATE DATABASE app3;

-- Or same database, different schemas
CREATE SCHEMA yaqeenpay;
CREATE SCHEMA app2;
```

**Option 2: Database per Application (Isolated)**
```yaml
# Separate PostgreSQL container per app
yaqeenpay-db:
  image: postgres:15-alpine
  ...

app2-db:
  image: postgres:15-alpine
  ...
```

**Recommended: Hybrid Approach**
- Shared PostgreSQL instance
- Separate database per application
- Shared services (auth, notifications) in common database

### Phase 4: CI/CD Pipeline (Week 4)

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/techtorio
            git pull origin main
            docker-compose down
            docker-compose build
            docker-compose up -d
```

### Phase 5: Monitoring & Logging (Week 5)

#### Add Monitoring Services
```yaml
  # Prometheus (Metrics)
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - techtorio-network

  # Grafana (Dashboards)
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    networks:
      - techtorio-network

  # Loki (Logs)
  loki:
    image: grafana/loki
    networks:
      - techtorio-network
```

### Phase 6: Backup Strategy

```bash
#!/bin/bash
# backup.sh - Daily backup script

# Backup databases
docker exec techtorio-postgres pg_dumpall -U techtorio_admin > /backups/db_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v techtorio_postgres-data:/data -v /backups:/backup alpine tar czf /backup/volumes_$(date +%Y%m%d).tar.gz /data

# Upload to S3/Cloud Storage
aws s3 cp /backups/ s3://techtorio-backups/ --recursive --exclude "*" --include "*$(date +%Y%m%d)*"
```

## Application Onboarding Process

### When Adding a New Application:

1. **Create Application Structure**
   ```bash
   mkdir -p /opt/techtorio/newapp/{backend,frontend}
   ```

2. **Add to docker-compose.yml**
   ```yaml
   newapp-backend:
     build: ./newapp/backend
     container_name: newapp-api
     ...
   ```

3. **Create Nginx Configuration**
   ```bash
   cp nginx/conf.d/app-template.conf nginx/conf.d/newapp.conf
   # Edit with new app details
   ```

4. **Create Database**
   ```sql
   CREATE DATABASE newapp;
   CREATE USER newapp_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE newapp TO newapp_user;
   ```

5. **Deploy**
   ```bash
   docker-compose up -d --build newapp-backend newapp-frontend
   nginx -s reload
   ```

6. **Update Landing Page**
   - Add new app card to gateway/html/index.html
   - Update navigation/links

## Cost Estimation

### Monthly Costs (Approximate)

**Option 1: Single VPS (Small Scale)**
- DigitalOcean Droplet (4GB RAM, 2 CPUs): $24/month
- Domain: $12/year
- SSL (Let's Encrypt): Free
- Total: ~$25/month

**Option 2: Cloud Provider (Production)**
- AWS EC2 t3.medium: $30/month
- AWS RDS PostgreSQL: $25/month
- CloudFront CDN: $10/month
- Route 53: $1/month
- Total: ~$66/month

**Option 3: Kubernetes (Large Scale)**
- Managed Kubernetes: $75/month
- Load Balancer: $15/month
- Storage: $20/month
- Total: ~$110/month

## Security Checklist

- ✅ SSL/TLS certificates (Let's Encrypt or purchased)
- ✅ Firewall (UFW) - Only ports 80, 443, 22 open
- ✅ Regular security updates
- ✅ Strong database passwords
- ✅ Docker security scanning
- ✅ Rate limiting in Nginx
- ✅ DDoS protection (Cloudflare)
- ✅ Backup strategy
- ✅ Monitoring & alerting
- ✅ Secret management (Docker secrets/vault)

## Recommended Tools

1. **Portainer** - Docker GUI management
2. **Watchtower** - Auto-update Docker containers
3. **Fail2ban** - Intrusion prevention
4. **Cloudflare** - DNS, CDN, DDoS protection
5. **Uptime Robot** - Uptime monitoring
6. **Sentry** - Error tracking
7. **GitLab/GitHub** - CI/CD

## Migration Path

### Current → Production

1. **Week 1**: Set up VPS, install Docker
2. **Week 2**: Configure Nginx gateway, deploy landing page
3. **Week 3**: Migrate YaqeenPay database and backend
4. **Week 4**: Deploy YaqeenPay frontend
5. **Week 5**: Set up monitoring, backups
6. **Week 6**: SSL, domain configuration, go live
7. **Week 7-8**: Testing, optimization

## Conclusion

This architecture provides:
- ✅ Scalability for multiple applications
- ✅ Easy application onboarding
- ✅ Centralized management
- ✅ Security best practices
- ✅ Cost-effective scaling
- ✅ Professional infrastructure

Start with Docker Compose on a single VPS, then scale to Kubernetes when you have 5+ applications or high traffic.
