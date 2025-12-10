#!/bin/bash
set -e

echo "🔨 Building Next.js application..."
npm run build

echo "📦 Creating complete deployment package..."
rm -f hims-complete.tar.gz

# Create tar with ALL necessary files
tar -czf hims-complete.tar.gz \
  .next/ \
  public/ \
  package.json \
  package-lock.json \
  next.config.ts \
  tsconfig.json \
  prisma/

echo "✅ Package created: $(ls -lh hims-complete.tar.gz | awk '{print $5}')"
echo ""
echo "📤 Now upload with:"
echo "scp -o PreferredAuthentications=password hims-complete.tar.gz root@31.97.223.11:/var/www/hims-app/"
echo ""
echo "🚀 Then on VPS run:"
echo "cd /var/www/hims-app"
echo "pm2 stop hims-app"
echo "tar -xzf hims-complete.tar.gz"
echo "npm install --production"
echo "pm2 start hims-app"
echo "pm2 save"
