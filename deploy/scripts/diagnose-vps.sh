#!/bin/bash

# VPS Diagnostic Script - Check what's wrong

echo "🔍 HIMS VPS Diagnostic Report"
echo "======================================"
echo ""

# 1. Check if Nginx is running
echo "1️⃣ Nginx Service Status:"
sudo systemctl status nginx --no-pager | head -10
echo ""

# 2. Check if ports are listening
echo "2️⃣ Listening Ports:"
sudo netstat -tlnp 2>/dev/null | grep -E ':(80|443|3000)' || echo "⚠️  No services listening on 80/443/3000"
echo ""

# 3. Check Nginx config
echo "3️⃣ Nginx Configuration Test:"
sudo nginx -t
echo ""

# 4. Check Nginx error log
echo "4️⃣ Recent Nginx Errors (last 20 lines):"
sudo tail -20 /var/log/nginx/error.log
echo ""

# 5. Check if Application is running
echo "5️⃣ Application Status (PM2):"
pm2 status
echo ""

# 6. Check Application logs
echo "6️⃣ Application Logs (last 10 errors):"
pm2 logs hims-app --err --lines 10 --nostream
echo ""

# 7. Check if port 3000 is open
echo "7️⃣ Test Local Connection (port 3000):"
curl -s http://localhost:3000 | head -5 || echo "❌ Cannot connect to localhost:3000"
echo ""

# 8. Check Nginx sites enabled
echo "8️⃣ Nginx Sites Enabled:"
ls -la /etc/nginx/sites-enabled/
echo ""

# 9. Check SSL certificates
echo "9️⃣ SSL Certificates:"
sudo ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "⚠️  No SSL certificates found"
echo ""

echo "======================================"
echo "End of Diagnostic Report"
