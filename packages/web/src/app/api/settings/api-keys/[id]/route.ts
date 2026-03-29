/**
 * 单个 API Key 操作端点
 *
 * DELETE /api/settings/api-keys/[id] — 删除（撤销）指定 API Key
 */
import { apiError, apiSuccess } from "@/lib/api-response";
import { deleteApiKey } from "@/lib/db/queries";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return apiError("VALIDATION_ERROR", "API key ID is required", 400);
    }

    await deleteApiKey(id);
    console.info(`[ApiKey] Deleted key: ${id}`);

    return apiSuccess({ deleted: true });
  } catch (err) {
    // Prisma P2025: Record not found
    if (err instanceof Error && err.message.includes("Record to delete does not exist")) {
      return apiError("NOT_FOUND", "API key not found", 404);
    }
    console.error("[ApiKey] Failed to delete key:", err);
    return apiError("INTERNAL_ERROR", "Failed to delete API key", 500);
  }
}
