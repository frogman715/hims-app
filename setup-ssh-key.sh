#!/bin/bash

# Setup SSH key on Hostinger VPS
# This script will prompt for password once

VPS_IP="31.97.223.11"
VPS_USER="hanmarine"
SSH_KEY_FILE="$HOME/.ssh/id_ed25519.pub"

echo "Setting up SSH key on VPS..."
echo "You will be prompted for password (hanmarine@31.97.223.11 password)"
echo ""

# Copy public key to VPS
ssh-copy-id -i "$SSH_KEY_FILE" -o "StrictHostKeyChecking=accept-new" "$VPS_USER@$VPS_IP"

echo ""
echo "✓ SSH key setup complete!"
echo "Testing passwordless connection..."
ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_IP" "echo 'SSH Key Authentication Works!'"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key authentication working!"
else
    echo "❌ SSH key authentication failed"
    exit 1
fi
