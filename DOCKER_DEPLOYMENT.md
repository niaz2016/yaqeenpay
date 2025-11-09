# TechTorio Docker Deployment Guide

This guide explains how to containerize and deploy the TechTorio application using Docker and Docker Compose.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for version control)
- PowerShell (Windows) or Bash (Linux/macOS)

### 1. Build Images Locally
```powershell
# Build both frontend and backend images
.\build-images.ps1 -BuildOnly

# Build only frontend
.\build-images.ps1 -FrontendOnly

# Build only backend
.\build-images.ps1 -BackendOnly
```

### 2. Run Application Locally
```powershell
# Start the application
.\deploy.ps1

# Or use Docker Compose directly
docker-compose up -d
```

### 3. Access Your Application
- **App (SPA + API via proxy)**: http://localhost:3000
- **Backend API (internal)**: Not exposed directly on host in the single-proxy model.
- **Swagger UI (through proxy)**: http://localhost:3000/api/swagger (adjust if backend serves swagger at /swagger)

If you temporarily need direct backend access (e.g., debugging Swagger UI original path), re-add a port mapping to the `backend` service in `docker-compose.yml`:
```yaml
  backend:
    # ...existing config...
    ports:
      - "5000:8080"
```

## 📁 Project Structure

```
techtorio/
├── Backend/
│   ├── Dockerfile                 # Backend container configuration
│   ├── .dockerignore             # Files to exclude from build
│   └── ... (backend source code)
├── Frontend/
│   ├── Dockerfile                # Frontend container configuration
│   ├── nginx.conf               # Nginx configuration for frontend
│   ├── .dockerignore            # Files to exclude from build
│   └── ... (frontend source code)
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── build-images.ps1             # Build script (Windows)
├── build-images.sh              # Build script (Linux/macOS)
├── deploy.ps1                   # Deployment script (Windows)
└── .env.example                 # Environment variables template
```

## 🛠️ Build Scripts

### Windows (PowerShell)
```powershell
# Build and tag images locally
.\build-images.ps1 -Registry "localhost:5000" -Tag "v1.0.0"

# Build and push to registry
.\build-images.ps1 -Registry "your-registry.com" -Tag "v1.0.0" -Push

# Build only frontend with custom tag
.\build-images.ps1 -FrontendOnly -Tag "frontend-v2.0"
```

### Linux/macOS (Bash)
```bash
# Make script executable
chmod +x build-images.sh

# Build and tag images locally
./build-images.sh --registry localhost:5000 --tag v1.0.0

# Build and push to registry
./build-images.sh --registry your-registry.com --tag v1.0.0 --push
```

## 🚀 Deployment

### Development Deployment
```powershell
# Start application in development mode
.\deploy.ps1

# View logs
.\deploy.ps1 -Logs

# Check status
.\deploy.ps1 -Status

# Stop application
.\deploy.ps1 -Down
```

### Production Deployment
```powershell
# Deploy to production with custom settings
.\deploy.ps1 -Environment production -Registry "your-registry.com" -Tag "v1.0.0"

# Deploy with custom ports
.\deploy.ps1 -Environment production -FrontendPort 80 -BackendPort 8080
```

### Manual Docker Compose Commands
```bash
# Development environment
docker-compose up -d
docker-compose down

# Production environment
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=2
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file from `.env.example` (only `FRONTEND_PORT` is used as the single public port in the default compose now):

```env
REGISTRY=your-registry.com
TAG=v1.0.0
FRONTEND_PORT=3000
# BACKEND_PORT retained for production compose where backend may be exposed
ASPNETCORE_ENVIRONMENT=Production
```

### Custom Nginx Configuration
The frontend uses Nginx with the following features:
- Gzip compression
- Client-side routing support
- API proxy to backend
- Static asset caching
- Security headers

Edit `Frontend/nginx.conf` to customize the configuration.

## 📊 Monitoring & Health Checks

Both containers include health checks:

```bash
# Check container health
docker ps

# Manual health check (frontend proxy)
curl http://localhost:3000

# Backend health (inside network)
docker exec techtorio-backend curl -f http://localhost:8080/health

# View detailed container information
docker inspect techtorio-frontend
docker inspect techtorio-backend
```

## 🔒 Production Considerations

### Security
1. **Use specific image tags** instead of `latest` in production
2. **Enable HTTPS** with proper SSL certificates
3. **Set strong database passwords** if using external database
4. **Limit container resources** using Docker Compose deploy configuration
5. **Run containers as non-root user** (already configured)

### Performance
1. **Resource Limits**: Configure memory and CPU limits in production
2. **Load Balancing**: Use multiple backend instances with a load balancer
3. **Database**: Use external database for production (PostgreSQL/SQL Server)
4. **Caching**: Configure Redis for session/data caching

### Example Production Configuration
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: "0.5"
        reservations:
          memory: 512M
          cpus: "0.25"
      restart_policy:
        condition: on-failure
        max_attempts: 3
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
  ```bash
  # Change frontend (single public) port in .env
  FRONTEND_PORT=3001
  ```

2. **Build Failures**
   ```bash
   # Clear Docker build cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Network Issues**
   ```bash
   # Recreate Docker network
   docker network prune
   docker-compose down
   docker-compose up -d
   ```

4. **Container Logs**
  ```bash
  # View specific container logs
  docker logs techtorio-frontend
  docker logs techtorio-backend
   
  # Follow logs in real-time
  docker logs -f techtorio-frontend
  docker logs -f techtorio-backend
  ```

### Performance Issues
```bash
# Monitor container resources
docker stats

# Check container processes
docker exec techtorio-backend ps aux
```

## 📚 Additional Commands

### Image Management
```bash
# List images
docker images | grep techtorio

# Remove old images
docker image prune

# Tag image for different registry
docker tag localhost:5000/techtorio-frontend:latest your-registry.com/techtorio-frontend:v1.0.0
```

### Container Management
```bash
# Execute commands in running container
docker exec -it techtorio-backend /bin/bash
docker exec -it techtorio-frontend /bin/sh

# Copy files from/to container
docker cp file.txt techtorio-backend:/app/
docker cp techtorio-backend:/app/logs ./logs
```

### Registry Operations
```bash
# Login to registry
docker login your-registry.com

# Push specific tag
docker push your-registry.com/techtorio-frontend:v1.0.0

# Pull specific tag
docker pull your-registry.com/techtorio-backend:v1.0.0
```

## 🤝 Contributing

1. Make changes to Dockerfile or docker-compose files
2. Test locally with `docker-compose up`
3. Update documentation if needed
4. Submit pull request

## 📝 License

This Docker configuration is part of the TechTorio project. See the main project license for details.