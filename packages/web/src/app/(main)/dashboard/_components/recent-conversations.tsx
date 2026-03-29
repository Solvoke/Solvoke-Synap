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
          <CardTitle className="text-sm font-medium">{t("recentConversations")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("noConversationsYet")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("installPlugins")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t("recentConversations")}</CardTitle>
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
              className="group flex items-stretch gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50 animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 平台品牌色竖条 */}
              <div
                className="w-1 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: getPlatformColor(conv.platform) }}
              />

              {/* 内容区 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{getPlatformLabel(conv.platform)}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatRelativeTime(conv.updatedAt, tTime)}
                  </span>
                </div>
                <p className="text-sm font-medium truncate mt-0.5 group-hover:text-primary transition-colors">
                  {conv.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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
