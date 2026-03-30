/**
 * Dashboard 首页
 *
 * Server Component — 从数据库获取统计数据展示。
 * 信息架构：统计卡片 → 趋势图 + 平台分布 → 最近对话列表。
 * 回答用户核心问题：「我最近和 AI 聊了什么？数据采集状况如何？」
 */
import { getTranslations } from "next-intl/server";

import { getDashboardStats } from "@/lib/db/queries";

import { PlatformChart } from "./_components/platform-chart";
import { RecentConversations } from "./_components/recent-conversations";
import { StatCards } from "./_components/stat-cards";
import { TrendChart } from "./_components/trend-chart";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {/* 第一行：4 个统计卡片 */}
      <StatCards
        totalConversations={stats.totalConversations}
        todayNewConversations={stats.todayNewConversations}
        totalMessages={stats.totalMessages}
        platformCount={stats.platformDistribution.length}
      />

      {/* 第二行：趋势图 + 平台分布（并排） */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrendChart data={stats.dailyTrend} />
        <PlatformChart data={stats.platformDistribution} totalConversations={stats.totalConversations} />
      </div>

      {/* 第三行：最近对话列表 */}
      <RecentConversations conversations={stats.recentConversations} />
    </div>
  );
}
