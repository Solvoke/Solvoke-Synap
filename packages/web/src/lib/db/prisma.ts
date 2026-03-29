/**
 * Prisma 客户端单例
 *
 * 为什么用单例：Next.js 在开发模式下会频繁热重载，每次重载都会创建新的 PrismaClient 实例。
 * 如果不用单例，数据库连接数会持续增长直到耗尽。
 * 这段代码把 client 存在全局变量上，避免重复创建。
 *
 * Prisma v7 要求使用 Driver Adapter。
 * PostgreSQL 使用 @prisma/adapter-pg 适配器。
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getEnv } from "@/lib/env";

// globalThis 是全局对象，在 Node.js 里等价于 global
// 把 prisma 实例挂在上面，热重载时不会丢失
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // PostgreSQL 适配器：传入连接配置对象
  // PrismaPg 接受 pg.PoolConfig 对象（不是连接字符串）
  // 通过 getEnv() 获取经过 Zod 校验的 DATABASE_URL，比 process.env.DATABASE_URL! 更安全
  const { DATABASE_URL } = getEnv();
  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 开发环境下保存到全局，生产环境不需要
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
