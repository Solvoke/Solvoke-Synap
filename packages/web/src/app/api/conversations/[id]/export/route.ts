/**
 * 对话导出 API — GET /api/conversations/:id/export
 *
 * 返回 Markdown 文件流，用于浏览器标准 HTTP 下载。
 * 相比客户端 Blob 方式，兼容性更好（Simple Browser、Safari 等都支持）。
 */
import { getConversationById } from "@/lib/db/queries";
import { type ExportConversation, formatConversationAsMarkdown, generateExportFilename } from "@/lib/export-markdown";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await getConversationById(id);

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // 构造导出数据结构
    const exportData: ExportConversation = {
      title: conversation.title,
      platform: conversation.platform,
      model: conversation.model,
      messageCount: conversation.messages.length,
      workspace: conversation.workspace,
      externalUrl: conversation.externalUrl,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        model: m.model,
        timestamp: m.timestamp,
      })),
    };

    const markdown = formatConversationAsMarkdown(exportData);
    const filename = generateExportFilename(exportData);

    // 对文件名进行 RFC 5987 编码，支持中文文件名
    const encodedFilename = encodeURIComponent(filename).replace(/%20/g, "+");

    // 返回标准 HTTP 文件下载响应
    return new Response(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
      },
    });
  } catch (error) {
    console.error("[Export] Failed to export conversation:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
