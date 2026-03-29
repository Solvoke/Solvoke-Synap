#!/bin/sh
# ==============================================================================
# Synap Web — Docker 启动脚本
# ==============================================================================
# 启动前自动运行 Prisma 数据库迁移，确保数据库表结构是最新的。
# prisma migrate deploy 只执行未应用的迁移，已应用的会跳过，是幂等安全操作。
# ==============================================================================

set -e

echo "[Startup] Running Prisma migrations..."
# standalone 镜像中没有全局 npx，直接调用 node_modules 中的 prisma CLI
node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
echo "[Startup] Migrations complete."

echo "[Startup] Starting Synap Web on port ${PORT:-3000}..."
exec node server.js
