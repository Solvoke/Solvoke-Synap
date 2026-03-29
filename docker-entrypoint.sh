#!/bin/sh
# ==============================================================================
# Synap Web — Docker 启动脚本
# ==============================================================================
# 启动前自动运行 Prisma 数据库迁移，确保数据库表结构是最新的。
# prisma migrate deploy 只执行未应用的迁移，已应用的会跳过，是幂等安全操作。
# ==============================================================================

set -e

echo "[Startup] Running Prisma migrations..."
# cd to packages/web so Prisma v7 can discover prisma.config.ts automatically
cd /app/packages/web
# Use prisma CLI from isolated /prisma-cli/ directory (separate from standalone node_modules)
# NODE_PATH lets prisma.config.ts resolve 'dotenv/config' and 'prisma/config' imports
NODE_PATH=/prisma-cli/node_modules node /prisma-cli/node_modules/prisma/build/index.js migrate deploy
echo "[Startup] Migrations complete."

echo "[Startup] Starting Synap Web on port ${PORT:-3000}..."
# Monorepo standalone: server.js is at packages/web/server.js
exec node /app/packages/web/server.js
