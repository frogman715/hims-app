#!/bin/bash

# Fix Nginx configuration untuk serve static files dengan benar

ssh hanmarine@31.97.223.11 << 'EOFNGINX'

# Backup existing config
sudo cp /etc/nginx/sites-available/hims-app /etc/nginx/sites-available/hims-app.bak

# Create proper Nginx config
sudo tee /etc/nginx/sites-available/hims-app > /dev/null << 'EOFCONFIG'
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.hanmarine.co www.app.hanmarine.co;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.hanmarine.co www.app.hanmarine.co;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/app.hanmarine.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.hanmarine.co/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Logging
    access_log /var/log/nginx/hims-app.log;
    error_log /var/log/nginx/hims-app-error.log;
    
    # Increase client body size for file uploads
    client_max_body_size 100M;
    
    # Proxy configuration
    location / {
        # Proxy to Next.js application
        proxy_pass http://localhost:3000;
        
        # HTTP version
        proxy_http_version 1.1;
        
        # Headers for WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Disable buffering for streaming
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Cache static assets with long expiry
    location ~* ^/_next/static/ {
        proxy_pass http://localhost:3000;
        
        # Cache for 1 year
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # Cache public files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        
        # Cache for 30 days
        add_header Cache-Control "public, max-age=2592000";
    }
}
EOFCONFIG

# Test configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

echo "✓ Nginx configuration updated"

EOFNGINX

echo "Nginx fixed!"
