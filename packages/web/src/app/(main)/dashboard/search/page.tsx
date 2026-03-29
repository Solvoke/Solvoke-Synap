/**
 * 搜索页面
 *
 * 混合 Server/Client 架构：
 * - SearchForm 是 Client Component（处理输入和表单提交）
 * - 搜索结果通过 URL searchParams 驱动，由 Server Component 获取
 *
 * 搜索流程：用户输入关键词 → 修改 URL ?q=xxx → Server Component 读取参数 → 查询数据库 → 渲染结果
 */

import Link from "next/link";

import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HighlightText } from "@/components/highlight-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getPlatformLabel } from "@/config/platform";
import { searchConversations } from "@/lib/db/queries";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

import { ConversationPagination } from "../conversations/pagination";
import { SearchForm } from "./search-form";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string; platform?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const keyword = params.q?.trim() || "";
  const page = Number(params.page) || 1;
  const platform = params.platform || undefined;

  // 只在有关键词时才搜索
  const data = keyword ? await searchConversations(keyword, { page, pageSize: 20, platform }) : null;

  const t = await getTranslations("search");
  const tCommon = await getTranslations("common");
  const tTime = await getTranslations("time");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {/* 搜索表单（Client Component） */}
      <SearchForm initialKeyword={keyword} />

      {/* 搜索结果 */}
      {!keyword ? (
        <Empty className="min-h-[300px] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : data && data.conversations.length === 0 ? (
        <Empty className="min-h-[300px] border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>{t("noResults")}</EmptyTitle>
            <EmptyDescription>{t("noResultsDescription", { keyword })}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : data ? (
        <>
          <p className="text-muted-foreground text-sm">{t("resultCount", { count: data.total, keyword })}</p>
          <div className="grid gap-3">
            {data.conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/dashboard/conversations/${conv.id}?q=${encodeURIComponent(keyword)}${conv.matchedMessageId ? `&messageId=${conv.matchedMessageId}` : ""}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-medium text-base leading-snug">
                        <HighlightText text={conv.title} keyword={keyword} />
                      </CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {getPlatformLabel(conv.platform)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* 消息内容预览片段（关键词高亮） */}
                    {conv.matchedSnippet && (
                      <p className="mb-2 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
                        <HighlightText text={conv.matchedSnippet} keyword={keyword} />
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <span>{tCommon("messages", { count: conv.messageCount })}</span>
                        {conv.model && (
                          <>
                            <span>·</span>
                            <span>{conv.model}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(conv.createdAt, tTime)}</span>
                      </div>
                      {conv.tags.length > 0 && (
                        <div className="flex gap-1">
                          {conv.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* 分页控件 — 仅多页时显示 */}
          {data.totalPages > 1 && <ConversationPagination currentPage={data.page} totalPages={data.totalPages} />}
        </>
      ) : null}
    </div>
  );
}
