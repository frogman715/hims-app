# Multi-stage build for Next.js production image
FROM node:20-alpine AS builder

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package*.json ./

# Install all dependencies for build (dev deps included)
RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs \
  && apk add --no-cache curl libc6-compat openssl

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY docker/entrypoint.sh ./entrypoint.sh

RUN chmod 755 entrypoint.sh && chown nextjs:nodejs entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]