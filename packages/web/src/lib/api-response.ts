/**
 * API 响应工具函数
 *
 * 统一 API 响应格式，避免每个路由重复写 NextResponse.json。
 */
import { NextResponse } from "next/server";

/** 成功响应 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** 错误响应 */
export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}
