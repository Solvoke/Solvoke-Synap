/**
 * API Key 管理端点
 *
 * GET  /api/settings/api-keys — 列出所有 API Key（密钥部分遮罩）
 * POST /api/settings/api-keys — 创建新 API Key（返回完整密钥，仅此一次）
 */
import { API_KEY_LENGTH, API_KEY_PREFIX } from "@synap/core";
import { nanoid } from "nanoid";

import { apiError, apiSuccess } from "@/lib/api-response";
import { createApiKey, getApiKeys } from "@/lib/db/queries";

/** 生成 sk-xxxx 格式的 API Key */
function generateApiKey(): string {
  return `${API_KEY_PREFIX}${nanoid(API_KEY_LENGTH)}`;
}

export async function GET() {
  try {
    const keys = await getApiKeys();
    return apiSuccess(keys);
  } catch (err) {
    console.error("[ApiKey] Failed to list keys:", err);
    return apiError("INTERNAL_ERROR", "Failed to list API keys", 500);
  }
}

export async function POST(request: Request) {
  try {
    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Default";

    // 名称长度限制
    if (name.length > 50) {
      return apiError("VALIDATION_ERROR", "Key name must be 50 characters or less", 422);
    }

    const key = generateApiKey();
    const created = await createApiKey(name, key);

    console.info(`[ApiKey] Created new key: ${name} (${created.id})`);

    return apiSuccess(created, 201);
  } catch (err) {
    console.error("[ApiKey] Failed to create key:", err);
    return apiError("INTERNAL_ERROR", "Failed to create API key", 500);
  }
}
