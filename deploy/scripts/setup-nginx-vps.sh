#!/bin/bash

# Setup Nginx untuk HIMS di VPS
# Run this script on VPS as root

set -e

echo "🔧 Setting up Nginx for HIMS..."

cd /var/www/hims-app

# 1. Pull latest code dari GitHub
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Copy Nginx config
echo "📝 Copying Nginx configuration..."
sudo cp nginx-hims-app.conf /etc/nginx/sites-available/app.hanmarine.co

# 3. Create symlink to enable site
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/app.hanmarine.co /etc/nginx/sites-enabled/

# 4. Remove default site if exists (prevent conflicts)
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "🗑️  Removing default Nginx site..."
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# 5. Test Nginx configuration
echo "✓ Testing Nginx configuration..."
sudo nginx -t

# 6. Restart Nginx
echo "🚀 Restarting Nginx..."
sudo systemctl restart nginx

# 7. Enable Nginx to start on boot
echo "⚙️  Enabling Nginx auto-start..."
sudo systemctl enable nginx

# 8. Verify status
echo ""
echo "📊 Nginx Status:"
sudo systemctl status nginx | head -5

echo ""
echo "✅ Nginx setup complete!"
echo ""
echo "Next: Setup SSL Certificate"
echo "Command: sudo certbot certonly --standalone -d app.hanmarine.co --non-interactive --agree-tos -m admin@hanmarine.co"
