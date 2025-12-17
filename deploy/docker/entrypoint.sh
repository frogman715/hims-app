#!/bin/sh
set -e

if [ -f /app/prisma/schema.prisma ]; then
  echo "Applying Prisma migrations..."
  npx prisma migrate deploy >/tmp/prisma-migrate.log && cat /tmp/prisma-migrate.log
fi

echo "Starting Next.js server..."
exec node server.js
