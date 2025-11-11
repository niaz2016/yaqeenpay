#!/usr/bin/env bash
# Install Tailscale inside a WSL distro (Ubuntu/Debian)
# Run this inside your WSL distro terminal (e.g., open Ubuntu from Windows Start)
# Usage:
#   chmod +x scripts/install_tailscale_wsl.sh
#   sudo ./scripts/install_tailscale_wsl.sh

set -euo pipefail

echo "Updating package lists..."
sudo apt-get update

echo "Installing prerequisites..."
sudo apt-get install -y curl gnupg2 lsb-release apt-transport-https ca-certificates

echo "Installing Tailscale..."
curl -fsSL https://pkgs.tailscale.com/stable/install.sh | sudo bash

echo "Starting tailscaled service (may require sudo)..."
sudo tailscaled --cleanup &
# Give tailscaled a moment to start
sleep 1

cat <<'EOF'
Now run one of the following to bring the machine onto your tailnet:

Interactive (opens browser on your Windows host):
  sudo tailscale up

Headless (recommended for servers) - create an auth key in admin.tailscale.com
and then run:
  sudo tailscale up --authkey tskey-<YOUR_KEY>

To view your Tailscale IPs:
  tailscale ip
  tailscale status

Notes:
- If you're using Docker Desktop with WSL2, ensure you run Docker from the same WSL distro where you installed tailscale,
  or use the sidecar container approach (see docker-compose.tailscale.yml in the repo).
- Do NOT run the installer from Windows PowerShell (sh is not available there). Run it inside WSL's bash/Ubuntu shell.
EOF
