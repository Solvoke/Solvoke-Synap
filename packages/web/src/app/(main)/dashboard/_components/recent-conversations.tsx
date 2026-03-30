/**
 * 最近对话列表组件
 *
 * 展示最近更新的 5-8 条对话，提供快速访问入口。
 * 为什么用 Server Component：纯展示，不需要客户端交互。
 * 设计：左侧平台色竖条 + 标题 + 元信息（消息数、模型、相对时间）。
 */
import Link from "next/link";

import { ArrowRight, MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformColor, getPlatformLabel } from "@/config/platform";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

interface RecentConversation {
  id: string;
  title: string;
  platform: string;
  messageCount: number;
  model: string | null;
  updatedAt: Date;
}

interface RecentConversationsProps {
  conversations: RecentConversation[];
}

export async function RecentConversations({ conversations }: RecentConversationsProps) {
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");
  const tTime = await getTranslations("time");

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-medium text-sm">{t("recentConversations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">{t("noConversationsYet")}</p>
            <p className="mt-1 text-muted-foreground text-xs">{t("installPlugins")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-medium text-sm">{t("recentConversations")}</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
          <Link href="/dashboard/conversations">
            {tCommon("viewAll")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {conversations.map((conv, index) => (
            <Link
              key={conv.id}
              href={`/dashboard/conversations/${conv.id}`}
              className="group flex animate-fade-in-up items-stretch gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 平台品牌色竖条 */}
              <div
                className="w-1 shrink-0 self-stretch rounded-full"
                style={{ backgroundColor: getPlatformColor(conv.platform) }}
              />

              {/* 内容区 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">{getPlatformLabel(conv.platform)}</span>
                  <span className="shrink-0 text-muted-foreground text-xs">
                    {formatRelativeTime(conv.updatedAt, tTime)}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-medium text-sm transition-colors group-hover:text-primary">
                  {conv.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
                  <span>{tCommon("messages", { count: conv.messageCount })}</span>
                  {conv.model && (
                    <>
                      <span>·</span>
                      <span>{conv.model}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
