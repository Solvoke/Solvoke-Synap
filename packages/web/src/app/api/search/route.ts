/**
 * 搜索 API
 *
 * GET /api/search?q=关键词&page=1&pageSize=20&platform=chatgpt
 * 搜索对话标题和消息内容。
 */
import { apiError, apiSuccess } from "@/lib/api-response";
import { searchConversations } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("q")?.trim();

    if (!keyword) {
      return apiError("VALIDATION_ERROR", "Search keyword is required", 400);
    }

    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Math.min(Number(searchParams.get("pageSize")) || 20, 100);
    const platform = searchParams.get("platform") || undefined;

    const result = await searchConversations(keyword, { page, pageSize, platform });
    return apiSuccess(result);
  } catch (err) {
    console.error("[API] Search failed:", err);
    return apiError("INTERNAL_ERROR", "Search failed", 500);
  }
}
