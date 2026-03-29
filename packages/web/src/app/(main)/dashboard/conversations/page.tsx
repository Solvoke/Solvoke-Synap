/**
 * 对话列表页
 *
 * Server Component — 直接调用数据库查询函数获取数据。
 * 为什么用 Server Component：列表数据在服务端获取更高效。
 * 卡片区域拆成 Client Component（ConversationList），负责多选和批量删除交互。
 *
 * searchParams 是 Next.js 16 的新写法，返回 Promise 需要 await。
 */

import { getTranslations } from "next-intl/server";

import { getConversations } from "@/lib/db/queries";

import { ConversationList } from "./conversation-list";
import { ConversationPagination } from "./pagination";
import { PlatformFilter } from "./platform-filter";

// Next.js 16 的 searchParams 是 Promise
interface PageProps {
  searchParams: Promise<{ page?: string; platform?: string }>;
}

export default async function ConversationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const platform = params.platform || undefined;

  const data = await getConversations({ page, pageSize: 20, platform });
  const t = await getTranslations("conversation");

  return (
    <div className="space-y-6">
      {/* 页面标题 + 筛选 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("allConversations")}</h1>
          <p className="text-muted-foreground text-sm">{t("totalRecords", { count: data.total })}</p>
        </div>
        <PlatformFilter currentPlatform={platform} />
      </div>

      {/* 对话列表（Client Component，支持多选+批量删除） */}
      <ConversationList conversations={data.conversations} platform={platform} />

      {/* 分页 */}
      {data.totalPages > 1 && (
        <ConversationPagination currentPage={data.page} totalPages={data.totalPages} platform={platform} />
      )}
    </div>
  );
}
