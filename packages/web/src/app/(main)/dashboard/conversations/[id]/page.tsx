/**
 * 对话详情页
 *
 * Server Component — 直接查询数据库获取对话及其所有消息。
 * 消息以气泡（bubble）样式展示，用户在右侧、AI 在左侧。
 *
 * Next.js 16 动态路由的 params 是 Promise，需要 await。
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, ExternalLink, FolderOpen } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPlatformLabel } from "@/config/platform";
import { getConversationByExternalId, getConversationById } from "@/lib/db/queries";

import { DeleteConversationButton } from "./delete-button";
import { ExportMarkdownButton } from "./export-button";
import { MessageList } from "./message-list";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ platform?: string; externalId?: string }>;
}

export default async function ConversationDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { platform, externalId } = await searchParams;

  // Support lookup by platform + externalId (from VSCode sidebar)
  // Falls back to direct ID lookup
  let conversation = null;
  if (platform && externalId) {
    conversation = await getConversationByExternalId(platform, externalId);
  }
  if (!conversation) {
    conversation = await getConversationById(id);
  }

  if (!conversation) {
    notFound();
  }

  const tCommon = await getTranslations("common");
  const t = await getTranslations("conversation");
  const format = await getFormatter();

  return (
    <div className="space-y-6">
      {/* 顶部：返回按钮 + 元信息 */}
      <div className="space-y-4">
        <Link href="/dashboard/conversations">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="size-4" />
            {tCommon("backToList")}
          </Button>
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-bold text-2xl tracking-tight">{conversation.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Badge variant="outline">{getPlatformLabel(conversation.platform)}</Badge>
              {conversation.model && <span>{conversation.model}</span>}
              <span>·</span>
              <span>{tCommon("messages", { count: conversation.messageCount })}</span>
              <span>·</span>
              <span>
                {format.dateTime(new Date(conversation.createdAt), {
                  dateStyle: "long",
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportMarkdownButton conversationId={conversation.id} />
            <DeleteConversationButton conversationId={conversation.id} conversationTitle={conversation.title} />
          </div>
        </div>

        {/* 标签和元数据 */}
        {(conversation.tags.length > 0 || conversation.externalUrl || conversation.workspace) && (
          <div className="flex flex-wrap items-center gap-2">
            {conversation.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {conversation.workspace && (
              <Badge variant="outline" className="text-xs">
                <FolderOpen className="mr-1 h-3 w-3" />
                {conversation.workspace}
              </Badge>
            )}
            {conversation.externalUrl && (
              <a
                href={conversation.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-xs underline-offset-4 hover:underline"
              >
                {t("viewOriginal")} <ExternalLink className="ml-1 inline h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* 消息列表（Client Component — 处理搜索关键词高亮和滚动定位） */}
      <MessageList messages={conversation.messages} />
    </div>
  );
}
