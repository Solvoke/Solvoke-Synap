/**
 * 对话导出 Markdown 按钮
 *
 * 通过标准 HTTP 链接下载（GET /api/conversations/:id/export），
 * 比客户端 Blob 方式兼容性更好（所有浏览器都支持 HTTP 文件下载）。
 */

import { Download } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  conversationId: string;
}

export async function ExportMarkdownButton({ conversationId }: ExportButtonProps) {
  const t = await getTranslations("common");

  return (
    <Button variant="outline" size="sm" className="gap-1" asChild>
      <a href={`/api/conversations/${conversationId}/export`} download>
        <Download className="size-4" />
        {t("export")}
      </a>
    </Button>
  );
}
