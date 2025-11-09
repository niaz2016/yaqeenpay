# Route Migration Guide: /techtorio/ → /escrow-market/

This guide documents the complete migration from `techtorio.online/techtorio/` to `techtorio.online/escrow-market/`.

## Overview

All public-facing routes have been updated from `/techtorio/` to `/escrow-market/` while maintaining backward compatibility through 301 redirects. Internal project names (Docker images, database, backend namespaces) remain unchanged.

## Files Modified

### Frontend Source Files
- ✅ `Frontend/src/services/mobileOAuth.ts` - Updated OAuth callback URL
- ✅ `Frontend/src/pages/ProductDetailPage.tsx` - Updated all absolute URLs
- ✅ `Frontend/src/pages/landing/LandingPage.tsx` - Updated SEO meta tags and JSON-LD
- ✅ `Frontend/index.html` - Updated all meta tags and JSON-LD schemas
- ✅ `Frontend/public/manifest.webmanifest` - Updated PWA paths and shortcuts
- ✅ `Frontend/Dockerfile` - Updated `VITE_BASE_PATH` from `/techtorio/` to `/escrow-market/`

### Gateway Files
- ✅ `gateway/html/sitemap.xml` - Updated sitemap URL

### Nginx Configuration
- ✅ `nginx/techtorio.conf` - Updated location blocks with 301 redirects
- ✅ `nginx/proxy.conf` - Updated Docker compose proxy configuration

### Deployment Scripts
- ✅ `deploy/deploy-techtorio.sh` - Updated target directory from `/opt/techtorio/techtorio` to `/opt/techtorio/escrow-market`

## Deployment Steps

### 1. Build New Docker Image

```bash
cd Frontend
docker compose build frontend
```

Or if using docker-compose.deploy.yml:
```bash
docker compose -f docker-compose.deploy.yml build frontend
```

### 2. Tag and Push to Registry (if using remote registry)

```bash
# Tag the image
docker tag techtoriofrontend:latest localhost:5000/techtoriofrontend:latest

# Push to registry
docker push localhost:5000/techtoriofrontend:latest
```

### 3. Backup Production Nginx Configs

```bash
# On production server
sudo cp /etc/nginx/sites-available/techtorio.conf /etc/nginx/sites-available/techtorio.conf.backup.$(date +%Y%m%d)
```

### 4. Update Nginx Configurations on Server

Copy the updated nginx configs from your local repo to production:

```bash
# From your local machine
scp nginx/techtorio.conf user@server:/tmp/
scp nginx/proxy.conf user@server:/tmp/

# On production server
sudo mv /tmp/techtorio.conf /etc/nginx/sites-available/techtorio.conf
sudo mv /tmp/proxy.conf /etc/nginx/conf.d/proxy.conf  # or wherever your configs are

# Test nginx configuration
sudo nginx -t
```

### 5. Deploy Using Updated Script

```bash
# On production server
cd /path/to/deploy
sudo ./deploy-techtorio.sh
```

The script will:
- Pull the new frontend image
- Create `/opt/techtorio/escrow-market/` directory
- Extract frontend static files to new location
- Reload nginx

### 6. Verify Deployment

Check that the new path works:
```bash
curl -I https://techtorio.online/escrow-market/
# Should return 200 OK

curl -I https://techtorio.online/techtorio/
# Should return 301 redirect to /escrow-market/
```

Test in browser:
- Visit `https://techtorio.online/escrow-market/` - should load frontend
- Visit `https://techtorio.online/techtorio/` - should redirect to `/escrow-market/`
- Check product links: `https://techtorio.online/escrow-market/products/{uuid}/`

### 7. Update Google Search Console

1. Submit new sitemap: `https://techtorio.online/sitemap.xml`
2. Request re-indexing for key pages:
   - `https://techtorio.online/escrow-market/`
   - Main product pages
3. Monitor 301 redirects in Coverage report
4. Old `/techtorio/` URLs will gradually update to new paths

### 8. Monitor Error Logs

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs for 301 redirects
sudo tail -f /var/log/nginx/access.log | grep 301
```

## Rollback Plan

If issues occur, rollback is straightforward:

1. Restore nginx configs:
   ```bash
   sudo cp /etc/nginx/sites-available/techtorio.conf.backup.YYYYMMDD /etc/nginx/sites-available/techtorio.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```

2. Previous frontend files should still exist at `/opt/techtorio/techtorio/` unless manually deleted

3. Rebuild with old path:
   ```bash
   cd Frontend
   docker build --build-arg VITE_BASE_PATH=/techtorio/ -t techtoriofrontend:rollback .
   ```

## Important Notes

### What Changed
- ✅ Public URLs: `/techtorio/` → `/escrow-market/`
- ✅ Nginx location blocks updated with 301 redirects
- ✅ Deploy target directory: `/opt/techtorio/escrow-market/`
- ✅ All frontend source code absolute paths
- ✅ PWA manifest paths
- ✅ SEO meta tags and JSON-LD schemas

### What Did NOT Change
- ❌ Docker image names (`techtoriofrontend`, `techtoriobackend`)
- ❌ Docker compose service names
- ❌ Backend C# namespaces (`TechTorio.Domain`, etc.)
- ❌ Database name
- ❌ Environment variables (except `VITE_BASE_PATH`)
- ❌ API endpoints (`/api/...` paths unchanged)

### SEO Impact
- 301 redirects preserve SEO value (90-99% link equity transfer)
- Google will gradually update indexed URLs over 2-6 weeks
- No penalties expected for proper 301 redirects
- Sitemap updated to reflect new URLs
- All internal links now point to `/escrow-market/`

## Troubleshooting

### Issue: Assets not loading (404 errors)
**Cause:** Base path mismatch between build and nginx
**Solution:** Verify `VITE_BASE_PATH` in Dockerfile matches nginx location block:
```bash
# Check Dockerfile
grep VITE_BASE_PATH Frontend/Dockerfile
# Should show: ARG VITE_BASE_PATH=/escrow-market/

# Check nginx
grep "location /escrow-market/" nginx/techtorio.conf
```

### Issue: Redirects create infinite loop
**Cause:** Conflicting nginx location blocks
**Solution:** Ensure redirect block comes BEFORE main location block:
```nginx
# CORRECT order:
location ~ ^/techtorio(/.*)?$ {
    return 301 /escrow-market$1;
}

location /escrow-market/ {
    alias /opt/techtorio/escrow-market/;
    # ...
}
```

### Issue: Mobile OAuth fails
**Cause:** `google-mobile.html` not in new path
**Solution:** Ensure all files extracted to `/opt/techtorio/escrow-market/`, including static HTML files

### Issue: PWA not updating
**Cause:** Service worker caching old manifest
**Solution:** Users need to clear cache or wait for cache expiry. Update manifest version if needed.

## Post-Migration Cleanup (Optional)

After 30 days of successful operation:

1. **Remove old static files:**
   ```bash
   sudo rm -rf /opt/techtorio/techtorio/
   ```

2. **Archive old nginx configs:**
   ```bash
   sudo mv /etc/nginx/sites-available/techtorio.conf.backup.* /var/backups/nginx/
   ```

3. **Monitor Google Search Console** - When old URLs are fully de-indexed, you can optionally return 410 Gone instead of 301.

## Testing Checklist

Before going live:
- [ ] Frontend builds successfully with new `VITE_BASE_PATH`
- [ ] Nginx config passes syntax check (`sudo nginx -t`)
- [ ] 301 redirects work correctly (test with curl)
- [ ] All assets load (CSS, JS, images) at new path
- [ ] Product detail pages load correctly
- [ ] Mobile OAuth flow works (if applicable)
- [ ] PWA manifest accessible at new path
- [ ] Sitemap reflects new URLs
- [ ] SEO meta tags show correct URLs in page source

After deployment:
- [ ] Verify frontend loads at `https://techtorio.online/escrow-market/`
- [ ] Verify old path redirects to new path
- [ ] Check browser console for any 404 errors
- [ ] Test product navigation and search
- [ ] Test user authentication flows
- [ ] Monitor server logs for errors
- [ ] Submit updated sitemap to Google Search Console

---

**Migration completed on:** [DATE]  
**Deployed by:** [NAME]  
**Issues encountered:** None expected if following guide

