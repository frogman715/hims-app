#!/bin/bash

# ============================================
# SSL CERTIFICATE SETUP WITH LET'S ENCRYPT
# For Niagahoster VPS
# ============================================
# Run this after Nginx is configured and
# port 443 is accessible

set -e

echo "════════════════════════════════════════════════════════════════"
echo "  SSL CERTIFICATE SETUP - LET'S ENCRYPT"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="app.hanmarine.co"
EMAIL="admin@hanmarine.co"

# ============================================
# STEP 1: Install Certbot
# ============================================
echo -e "${YELLOW}[1/3]${NC} Installing Certbot..."

if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✓${NC} Certbot already installed"
else
    sudo apt-get update -y
    sudo apt-get install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✓${NC} Certbot installed"
fi
echo ""

# ============================================
# STEP 2: Get SSL Certificate
# ============================================
echo -e "${YELLOW}[2/3]${NC} Getting SSL certificate for $DOMAIN..."

sudo certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} SSL certificate obtained"
else
    echo "Certificate obtained or already exists"
fi
echo ""

# ============================================
# STEP 3: Setup Auto-Renewal
# ============================================
echo -e "${YELLOW}[3/3]${NC} Setting up auto-renewal..."

sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo -e "${GREEN}✓${NC} Auto-renewal enabled"

# Test renewal
echo ""
echo "Testing certificate renewal (dry-run)..."
sudo certbot renew --dry-run

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ SSL SETUP COMPLETE!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Certificate Details:"
sudo certbot certificates
echo ""
echo "Useful Commands:"
echo "  • Renew immediately: sudo certbot renew --force-renewal"
echo "  • Check renewal status: sudo certbot certificates"
echo "  • View renewal logs: sudo tail -f /var/log/letsencrypt/letsencrypt.log"
echo ""
echo "Verify HTTPS:"
echo "  • curl -I https://$DOMAIN"
echo "  • Should return HTTP/2 200"
echo ""
echo "════════════════════════════════════════════════════════════════"
