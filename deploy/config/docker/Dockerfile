# Multi-stage build for Next.js production image
FROM node:20-alpine AS deps

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production && \
    npm cache clean --force

# Builder stage
FROM node:20-alpine AS builder

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN apk add --no-cache libc6-compat && \
    npm ci && \
    npm cache clean --force

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache \
    curl \
    libc6-compat \
    openssl \
    dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy production node_modules from deps stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy entrypoint script
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod 755 entrypoint.sh && chown nextjs:nodejs entrypoint.sh

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production \
    HOSTNAME="0.0.0.0"

# Improved health check with better timing
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["./entrypoint.sh"]