/**
 * 对话详情 API
 *
 * GET /api/conversations/[id] — 返回单个对话的完整内容（包含所有消息）。
 * DELETE /api/conversations/[id] — 删除单个对话及其所有消息。
 */
import { apiError, apiSuccess } from "@/lib/api-response";
import { deleteConversation, getConversationById } from "@/lib/db/queries";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await getConversationById(id);

    if (!conversation) {
      return apiError("NOT_FOUND", "Conversation not found", 404);
    }

    return apiSuccess(conversation);
  } catch (err) {
    console.error("[API] Failed to get conversation:", err);
    return apiError("INTERNAL_ERROR", "Failed to get conversation details", 500);
  }
}

/** 删除单个对话 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deleted = await deleteConversation(id);

    if (!deleted) {
      return apiError("NOT_FOUND", "Conversation not found", 404);
    }

    return apiSuccess({ id }, 200);
  } catch (err) {
    console.error("[API] Failed to delete conversation:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete conversation", 500);
  }
}
