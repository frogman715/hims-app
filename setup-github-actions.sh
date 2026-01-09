#!/bin/bash

#############################################################################
# SETUP GITHUB ACTIONS FOR AUTO-DEPLOY
# Run this script locally to help setup GitHub Actions
#############################################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  HIMS GITHUB ACTIONS DEPLOYMENT - SETUP HELPER             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if SSH key exists
echo "📋 Step 1: Check SSH Key"
SSH_KEY_PATH="$HOME/.ssh/id_rsa"

if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    echo "Generate one with: ssh-keygen -t ed25519"
    exit 1
fi

echo "✓ SSH key found: $SSH_KEY_PATH"
echo ""

# Show what needs to be copied
echo "📋 Step 2: Copy GitHub Secrets"
echo ""
echo "Go to: https://github.com/frogman715/hims-app/settings/secrets/actions"
echo ""
echo "Click 'New repository secret' and create these 3 secrets:"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 1: VPS_IP"
echo "Value: [Your VPS IP address, e.g., 123.45.67.89]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 2: VPS_USER"
echo "Value: ubuntu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Secret 3: SSH_PRIVATE_KEY"
echo "Value: [Copy entire contents of your private key below]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Your SSH Private Key (copy everything):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$SSH_KEY_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🎯 Step 3: Test Deployment"
echo ""
echo "After adding secrets, test with:"
echo "  git push origin main"
echo ""
echo "✓ GitHub Actions will auto-deploy!"
echo "✓ Check status: GitHub → Actions → Deploy to VPS"
echo ""

echo "✅ Setup complete!"
echo ""
