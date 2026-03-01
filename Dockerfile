# Multi-stage build for Next.js application
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone build or fallback to normal build
COPY --from=builder /app/.next/standalone ./ 2>/dev/null || (mkdir -p .next && cp -r /app/.next/* .next/ 2>/dev/null; cp /app/package.json .; cp -r /app/node_modules .)
COPY --from=builder /app/.next/static ./.next/static 2>/dev/null || true
COPY --from=builder /app/public ./public 2>/dev/null || true

EXPOSE 3000
CMD ["node", "server.js"]
