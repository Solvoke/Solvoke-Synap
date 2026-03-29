/**
 * 健康检查 API
 *
 * GET /api/health
 * 用于检查服务是否正常运行，插件连接前会先调用这个端点。
 */
import { NextResponse } from "next/server";

import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    // 简单查询验证数据库连接正常
    await prisma.conversation.count();

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: APP_CONFIG.version,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Database connection failed" }, { status: 503 });
  }
}
