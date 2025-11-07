#!/usr/bin/env bash
set -euo pipefail

# YaqeenPay deployment script for a host with Nginx already installed.
# - Pulls images from a Docker registry
# - Starts backend bound to 127.0.0.1:5000
# - Extracts frontend static files from the image to /opt/techtorio/yaqeenpay
# - Reloads Nginx

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Required env vars / defaults
: "${REGISTRY:=localhost:5000}"
: "${TAG:=latest}"

# Optional: provide these via environment or .env file (docker compose will read .env next to compose)
: "${ASPNETCORE_ENVIRONMENT:=Production}"

# Ensure target directories exist
sudo mkdir -p /opt/techtorio/yaqeenpay
sudo mkdir -p /opt/techtorio/backend/Documents

echo "==> Pulling images from registry: $REGISTRY (tag: $TAG)"
docker compose -f "$REPO_ROOT/docker-compose.deploy.yml" pull

echo "==> Starting backend container"
docker compose -f "$REPO_ROOT/docker-compose.deploy.yml" up -d backend

echo "==> Waiting for backend health"
for i in {1..20}; do
  if curl -fsS http://127.0.0.1:5000/health >/dev/null 2>&1; then
    echo "Backend is healthy"
    break
  fi
  sleep 3
  if [[ $i -eq 20 ]]; then
    echo "ERROR: Backend did not become healthy in time" >&2
    exit 1
  fi
done

echo "==> Preparing to extract frontend static assets to /opt/techtorio/yaqeenpay"
tmp_cid=""
trap '[[ -n "$tmp_cid" ]] && docker rm -f "$tmp_cid" >/dev/null 2>&1 || true' EXIT

tmp_cid=$(docker create "${REGISTRY}/yaqeenpayfrontend:${TAG}")
sudo rm -rf /opt/techtorio/yaqeenpay/*
docker cp "$tmp_cid":/usr/share/nginx/html/. /tmp/yaqeenpay-build
sudo rsync -a --delete /tmp/yaqeenpay-build/ /opt/techtorio/yaqeenpay/
rm -rf /tmp/yaqeenpay-build

echo "==> Reloading Nginx"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl reload nginx || sudo systemctl restart nginx
else
  # Fallback for systems without systemd
  sudo nginx -s reload || sudo service nginx restart
fi

echo "==> Deployment complete"
echo "Check: https://techtorio.online/yaqeenpay and https://techtorio.online/api/health (if exposed)"
