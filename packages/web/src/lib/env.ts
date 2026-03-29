/**
 * 环境变量验证
 *
 * 为什么需要验证：如果必要的环境变量缺失或格式错误，应用应该在启动时立即报错，
 * 而不是等到运行时某个功能用到时才崩溃。这样能更快定位配置问题。
 *
 * 使用方式：在需要读取环境变量的地方，用 `import { env } from '@/lib/env'`
 * 替代直接访问 `process.env.XXX`，获得类型安全和启动校验。
 */

import { z } from "zod";

// 定义环境变量的 schema
const envSchema = z.object({
  // PostgreSQL 连接字符串，必须以 postgresql:// 或 postgres:// 开头
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL is required" })
    .startsWith("postgresql://", {
      message: "DATABASE_URL must start with postgresql:// or postgres://",
    })
    .or(
      z.string().startsWith("postgres://", {
        message: "DATABASE_URL must start with postgresql:// or postgres://",
      }),
    ),

  // Node 环境，由 Next.js 自动注入，不需要手动设置
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// 导出 schema 类型（方便其他模块引用）
export type Env = z.infer<typeof envSchema>;

/**
 * 解析并验证环境变量
 *
 * 如果验证失败，会打印清晰的错误信息并终止进程。
 * 在 Next.js 里，这个模块会在首次 import 时执行（即服务端启动时）。
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("[Env] Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error("[Env] Please check your .env file. See .env.example for reference.");
    // 在构建阶段（next build）不应终止进程，但运行时应报错
    // Next.js build 时 DATABASE_URL 可能不存在，这是正常的
    throw new Error("Missing or invalid environment variables");
  }

  return result.data;
}

// 延迟验证：导出函数而非立即执行，让调用方决定何时校验
// 这样 next build 阶段不会因为缺少 .env 而失败
export function getEnv(): Env {
  return validateEnv();
}
