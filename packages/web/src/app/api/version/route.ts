/**
 * 版本信息 API
 *
 * GET /api/version
 * 返回当前 synap-web 实例的版本号，供插件检查是否需要升级。
 * 不需要认证（公开端点），与 /api/health 类似但更轻量。
 */
import { NextResponse } from "next/server";

import { APP_CONFIG } from "@/config/app-config";

export async function GET() {
  return NextResponse.json({
    name: APP_CONFIG.name,
    version: APP_CONFIG.version,
  });
}
