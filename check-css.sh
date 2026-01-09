#!/bin/bash

# Quick CSS fix test

ssh hanmarine@31.97.223.11 << 'EOF'
echo "=== Check CSS files ==="
find /var/www/hims-app/.next/static -name "*.css" | head -5

echo ""
echo "=== Check if app responding to requests ==="
curl -s -I http://localhost:3000/auth/signin | head -10

echo ""
echo "=== Test CSS file access ==="
CSS_FILE=$(find /var/www/hims-app/.next/static/css -name "*.css" 2>/dev/null | head -1)
if [ -n "$CSS_FILE" ]; then
    echo "Found CSS: $CSS_FILE"
    curl -s -I http://localhost:3000/_next/static/css/$(basename "$CSS_FILE")
else
    echo "No CSS files found!"
fi

echo ""
echo "=== Check public folder ==="
ls -la /var/www/hims-app/public/

echo ""
echo "=== Check build success ==="
cat /var/www/hims-app/.next/BUILD_ID 2>/dev/null || echo "No BUILD_ID"

EOF
