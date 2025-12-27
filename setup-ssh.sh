#!/bin/bash

# Setup SSH Key untuk Hostinger VPS
# Requires manual password entry ONCE

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"

echo "================================================"
echo "  SSH Key Setup untuk Hostinger VPS"
echo "================================================"
echo ""
echo "Akan diminta password 1x:"
echo "  VPS: $VPS_IP"
echo "  User: $VPS_USER"
echo ""

# Generate SSH key jika belum ada
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "Generating SSH key..."
    ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -C "hims-deploy" > /dev/null
    echo "✓ SSH key generated"
fi

echo ""
echo "Copying public key to VPS..."
echo "(Enter password when prompted)"
echo ""

# Copy key
ssh-copy-id -i ~/.ssh/id_ed25519.pub -o StrictHostKeyChecking=accept-new "$VPS_USER@$VPS_IP"

echo ""
echo "Testing passwordless connection..."
if ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'SSH OK'" 2>/dev/null; then
    echo "✓ SSH key authentication working!"
    echo ""
    echo "You can now run DEPLOY_EXISTING.sh without password prompts"
else
    echo "✗ SSH connection failed"
    exit 1
fi
