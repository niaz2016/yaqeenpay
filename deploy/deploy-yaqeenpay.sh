#!/usr/bin/env bash
set -euo pipefail

# YaqeenPay deployment script for a host with Nginx already installed.
# - Pulls images from a Docker registry
# - Starts backend bound to 127.0.0.1:5000
# - Extracts frontend static files from the image to /opt/techtorio/escrow-market
# - Reloads Nginx

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Required env vars / defaults
: "${REGISTRY:=localhost:5000}"
: "${TAG:=latest}"

# Optional: provide these via environment or .env file (docker compose will read .env next to compose)
: "${ASPNETCORE_ENVIRONMENT:=Production}"

# Derived image names (configurable via REGISTRY / TAG above). Use the frontend image name
# that matches the local build naming convention (note the hyphen).
: "${FRONTEND_IMAGE_NAME:=${REGISTRY}/yaqeenpay-frontend:${TAG}}"

# Ensure target directories exist
sudo mkdir -p /opt/techtorio/escrow-market
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

echo "==> Preparing to extract frontend static assets to /opt/techtorio/escrow-market"
tmp_cid=""
trap '[[ -n "$tmp_cid" ]] && docker rm -f "$tmp_cid" >/dev/null 2>&1 || true' EXIT

echo "Using frontend image: ${FRONTEND_IMAGE_NAME}"
if ! tmp_cid=$(docker create "${FRONTEND_IMAGE_NAME}" 2>/dev/null); then
  echo "ERROR: Failed to create container from image ${FRONTEND_IMAGE_NAME}." >&2
  echo "Verify the image name and registry (REGISTRY/TAG) or build/push the image first." >&2
  exit 1
fi

sudo rm -rf /opt/techtorio/escrow-market/* || true
docker cp "$tmp_cid":/usr/share/nginx/html/. /tmp/escrow-market-build
if [[ $? -ne 0 ]]; then
  echo "ERROR: docker cp failed (container: $tmp_cid)." >&2
  docker rm -f "$tmp_cid" >/dev/null 2>&1 || true
  exit 1
fi
sudo rsync -a --delete /tmp/escrow-market-build/ /opt/techtorio/escrow-market/
rm -rf /tmp/escrow-market-build

echo "==> Reloading Nginx"
if command -v systemctl >/dev/null 2>&1; then
  sudo systemctl reload nginx || sudo systemctl restart nginx
else
  # Fallback for systems without systemd
  sudo nginx -s reload || sudo service nginx restart
fi

echo "==> Deployment complete"
echo "Check: https://techtorio.online/escrow-market and https://techtorio.online/api/health (if exposed)"
