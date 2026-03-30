/**
 * Dashboard 统计卡片组件
 *
 * 展示 4 个核心数据指标：总对话数、今日新增、总消息数、平台数。
 * 为什么用 Server Component：数据直接从 props 传入，不需要客户端交互。
 * 设计规范：大数字是视觉焦点（text-3xl font-bold），标题和描述弱化。
 */
import Link from "next/link";

import { Layers, MessageSquare, Plus, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";

interface StatCardsProps {
  totalConversations: number;
  todayNewConversations: number;
  totalMessages: number;
  platformCount: number;
}

export async function StatCards({
  totalConversations,
  todayNewConversations,
  totalMessages,
  platformCount,
}: StatCardsProps) {
  const t = await getTranslations("dashboard");

  const cards = [
    {
      title: t("totalConversations"),
      value: totalConversations,
      description: t("fromPlatforms", { count: platformCount }),
      icon: MessageSquare,
      href: "/dashboard/conversations",
    },
    {
      title: t("newToday"),
      value: todayNewConversations,
      description: t("addedToday"),
      icon: Plus,
    },
    {
      title: t("totalMessages"),
      value: totalMessages,
      description: t("acrossAll"),
      icon: Layers,
    },
    {
      title: t("platforms"),
      value: platformCount,
      description: t("connectedSources"),
      icon: Zap,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <Card
            key={card.title}
            className="group hover:-translate-y-0.5 p-6 transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                <span>{card.title}</span>
              </div>
              <div className="mt-3">
                <p className="font-bold text-3xl tracking-tight">{card.value.toLocaleString()}</p>
                <p className="mt-1 text-muted-foreground text-xs">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        );

        // 有链接的卡片可点击跳转
        if (card.href) {
          return (
            <Link key={card.title} href={card.href} className="block">
              {content}
            </Link>
          );
        }

        return <div key={card.title}>{content}</div>;
      })}
    </div>
  );
}
