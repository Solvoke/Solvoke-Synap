# ==============================================================================
# Solvoke Synap Web — Dockerfile (Monorepo multi-stage build)
# ==============================================================================
# Build from the monorepo root:
#   docker compose up -d
#
# Or manually:
#   docker build -t synap-web:latest .
#
# Multi-stage build:
# 1. deps: install dependencies (cached when package.json unchanged)
# 2. builder: compile Next.js standalone output
# 3. runner: minimal production image (~200MB)
# ==============================================================================

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps
WORKDIR /build

# Copy root workspace config + lockfile
COPY package.json package-lock.json ./

# Copy packages' dependency declarations (for layer caching)
COPY packages/core/package.json ./packages/core/
COPY packages/web/package.json ./packages/web/

# Install all dependencies via npm workspaces (resolves @synap/core as symlink)
# --ignore-scripts: skip postinstall (build:core + prisma generate) since source
# files are not yet available; the Dockerfile handles these steps explicitly below
RUN npm ci --ignore-scripts

# Copy core source and build it (web needs the compiled output)
COPY packages/core/ ./packages/core/
RUN npm run build -w packages/core


# --- Stage 2: Build application ---
FROM node:20-alpine AS builder
WORKDIR /build

# Copy entire workspace from deps stage (node_modules + built core)
COPY --from=deps /build/ ./

# Copy web source code
COPY packages/web/ ./packages/web/

# Generate Prisma Client
RUN cd packages/web && npx prisma generate

# Build Next.js (standalone mode)
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN cd packages/web && npm run build


# --- Stage 3: Production runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (includes server.js and minimal node_modules)
# In monorepo, standalone preserves directory structure: packages/web/server.js
COPY --from=builder /build/packages/web/.next/standalone ./
# Copy static assets to match monorepo structure
COPY --from=builder /build/packages/web/.next/static ./packages/web/.next/static

# Copy Prisma files for migrate deploy at startup
# In monorepo, node_modules are hoisted to root, so copy from /build/node_modules/
COPY --from=builder /build/packages/web/prisma ./packages/web/prisma
COPY --from=builder /build/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /build/node_modules/@prisma/client ./node_modules/@prisma/client

# Install prisma CLI + dotenv for running migrate deploy at startup
RUN npm install --no-save prisma dotenv

# Copy Prisma v7 config file
COPY --from=builder /build/packages/web/prisma.config.ts ./packages/web/prisma.config.ts

# Copy entrypoint script (at monorepo root)
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set file ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
