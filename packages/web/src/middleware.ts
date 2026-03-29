/**
 * Next.js 中间件 — CORS 和请求处理
 *
 * 为什么需要 CORS：
 * Chrome 插件的 Content Script 和 Popup UI 发送的请求受浏览器同源策略限制。
 * 虽然 Service Worker 可以绕过（通过 host_permissions），但开发调试时
 * 直接从浏览器或 curl 测试 API 也需要 CORS 头。
 *
 * 工作方式：
 * 1. 所有 /api/* 请求自动添加 CORS 响应头
 * 2. 自动处理 OPTIONS 预检请求（preflight）
 * 3. 开发环境允许所有来源，生产环境限制为插件来源
 */
import { type NextRequest, NextResponse } from "next/server";

/** 允许的 HTTP 方法 */
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

/** 允许的请求头 */
const ALLOWED_HEADERS = "Content-Type, Authorization, X-Synap-Client";

/**
 * 判断请求来源是否被允许
 *
 * 开发环境：允许所有来源（方便调试）
 * 生产环境：只允许 Chrome 插件、VSCode Webview、localhost
 */
function isAllowedOrigin(origin: string | null): boolean {
  // 没有 origin 的请求（如 curl、Service Worker fetch）直接通过
  if (!origin) return true;

  // 开发环境允许所有
  if (process.env.NODE_ENV === "development") return true;

  // 生产环境白名单
  const allowedPatterns = [
    /^chrome-extension:\/\//, // Chrome 插件
    /^moz-extension:\/\//, // Firefox 插件（未来可能支持）
    /^vscode-webview:\/\//, // VSCode Webview
    /^https?:\/\/localhost(:\d+)?$/, // 本地开发
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/, // 本地开发
  ];

  return allowedPatterns.some((pattern) => pattern.test(origin));
}

/** 构建 CORS 响应头 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    // 如果有来源且被允许，返回该来源；否则不设置（阻止请求）
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(origin) ? origin : "",
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    // 允许跨域请求携带凭据（cookies 等），未来可能需要
    "Access-Control-Allow-Credentials": "true",
    // 预检请求缓存时间（1 小时），减少重复预检
    "Access-Control-Max-Age": "3600",
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只处理 API 路由
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");

  // OPTIONS 预检请求：直接返回 204，不需要经过业务逻辑
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  // 非预检请求：继续处理，但在响应上添加 CORS 头
  const response = NextResponse.next();
  const corsHeaders = getCorsHeaders(origin);

  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * 中间件匹配规则
 *
 * 只在 /api/* 路径下执行，避免影响页面路由性能。
 * 这是 Next.js 的 matcher 配置，不是通用正则。
 */
export const config = {
  matcher: "/api/:path*",
};
