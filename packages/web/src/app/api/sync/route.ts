/**
 * 数据同步 API
 *
 * POST /api/sync
 * Chrome 插件和 VSCode 插件通过这个端点上报对话数据。
 * 请求体格式遵循 @synap/core 的 SyncRequest schema。
 *
 * 安全加固：
 * - API Key 认证（数据库中有 Key 时必须携带，无 Key 时放行）
 * - 请求体大小限制 4MB（手动检查 Content-Length）
 * - conversations 数组最多 50 条（zod schema 层面校验）
 * - JSON 解析失败返回专用错误码
 * - 分批处理避免数据库连接池耗尽
 * - 单条同步失败时附带错误原因
 */
import { MAX_SYNC_BODY_SIZE, nowISO, type SyncRequest, syncRequestSchema } from "@synap/core";

import { apiError, apiSuccess } from "@/lib/api-response";
import { syncConversation, validateApiKey } from "@/lib/db/queries";

/** 数据库并发批次大小，避免连接池耗尽 */
const DB_BATCH_SIZE = 5;

/**
 * 从 Authorization header 提取 Bearer token
 * 格式：Authorization: Bearer sk-xxxx
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim() || null;
}

export async function POST(request: Request) {
  try {
    // API Key 认证：数据库有 Key 时必须携带有效 token
    const token = extractBearerToken(request);
    const authResult = await validateApiKey(token);

    if (authResult === "invalid") {
      return apiError("UNAUTHORIZED", "Invalid or missing API key. Generate one in Dashboard Settings.", 401);
    }

    // 检查请求体大小（App Router 没有内置 bodyParser.sizeLimit，需手动校验）
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SYNC_BODY_SIZE) {
      return apiError(
        "PAYLOAD_TOO_LARGE",
        `Request body too large: ${contentLength} bytes (limit: ${MAX_SYNC_BODY_SIZE} bytes)`,
        413,
      );
    }

    // 解析请求体，单独捕获 JSON 解析错误
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_JSON", "Request body is not valid JSON", 400);
    }

    // 用 zod schema 验证请求体（包含 conversations.max(50) 限制）
    const parseResult = syncRequestSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("[Sync] Invalid request body:", parseResult.error.issues);
      return apiError(
        "VALIDATION_ERROR",
        `Validation failed: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
        422,
      );
    }

    const syncRequest: SyncRequest = parseResult.data;
    console.info(`[Sync] Received ${syncRequest.conversations.length} conversations from ${syncRequest.platform}`);

    // 分批处理对话，每批 DB_BATCH_SIZE 条并行，避免打爆数据库连接池
    // 为什么不用 Promise.all 全量并发：50 条对话 × 每条 2 条 SQL = 100 条并发查询，
    // Prisma 默认连接池大小约 5-10，全量并发会导致连接等待超时。
    const results: { conversationId: string; status: string; error?: string }[] = [];
    const conversations = syncRequest.conversations;

    for (let i = 0; i < conversations.length; i += DB_BATCH_SIZE) {
      const batch = conversations.slice(i, i + DB_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (conversation) => {
          try {
            const status = await syncConversation(conversation);
            return { conversationId: conversation.id, status };
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            console.error(`[Sync] Failed to sync conversation ${conversation.id}:`, err);
            return { conversationId: conversation.id, status: "skipped" as const, error: errorMessage };
          }
        }),
      );
      results.push(...batchResults);
    }

    console.info(
      `[Sync] Completed: ${results.filter((r) => r.status === "created").length} created, ` +
        `${results.filter((r) => r.status === "updated").length} updated, ` +
        `${results.filter((r) => r.status === "skipped").length} skipped`,
    );

    return apiSuccess({
      results,
      serverTimestamp: nowISO(),
    });
  } catch (err) {
    console.error("[Sync] Unexpected error:", err);
    return apiError("INTERNAL_ERROR", "Sync failed, please try again later", 500);
  }
}
