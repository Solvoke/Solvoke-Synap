/**
 * 对话列表 API
 *
 * GET /api/conversations?page=1&pageSize=20&platform=chatgpt — 返回分页的对话列表。
 * DELETE /api/conversations — 批量删除对话（请求体传入 ids 数组）。
 */
import { apiError, apiSuccess } from "@/lib/api-response";
import { deleteConversations, getConversations } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Math.min(Number(searchParams.get("pageSize")) || 20, 100);
    const platform = searchParams.get("platform") || undefined;

    const result = await getConversations({ page, pageSize, platform });
    return apiSuccess(result);
  } catch (err) {
    console.error("[API] Failed to get conversations:", err);
    return apiError("INTERNAL_ERROR", "Failed to get conversations", 500);
  }
}

/** 批量删除对话 */
export async function DELETE(request: Request) {
  try {
    // 单独捕获 JSON 解析错误
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("INVALID_JSON", "Request body is not valid JSON", 400);
    }

    const ids = (body as { ids?: unknown })?.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("INVALID_PARAMS", "Please provide a list of conversation IDs to delete", 400);
    }

    // 安全限制：单次最多删除 100 条
    const MAX_BATCH_DELETE = 100;
    if (ids.length > MAX_BATCH_DELETE) {
      return apiError("INVALID_PARAMS", `Batch delete limit is ${MAX_BATCH_DELETE} conversations`, 400);
    }

    const deletedCount = await deleteConversations(ids);
    return apiSuccess({ deletedCount });
  } catch (err) {
    console.error("[API] Failed to batch delete conversations:", err);
    return apiError("INTERNAL_ERROR", "Failed to batch delete conversations", 500);
  }
}
