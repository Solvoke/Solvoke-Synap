/**
 * 7 日对话趋势面积图
 *
 * 使用 recharts AreaChart 展示最近 7 天的对话新增趋势。
 * 为什么用 'use client'：recharts 需要在浏览器端渲染图表。
 * 配色使用 CSS 变量 --chart-1，自动适配亮暗模式。
 */
"use client";

import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TrendChartProps {
  data: { date: string; count: number }[];
}

/** 将 YYYY-MM-DD 格式化为短日期（如 "3/10"） */
function formatShortDate(dateStr: string): string {
  const parts = dateStr.split("-");
  const month = Number.parseInt(parts[1], 10);
  const day = Number.parseInt(parts[2], 10);
  return `${month}/${day}`;
}

export function TrendChart({ data }: TrendChartProps) {
  const t = useTranslations("dashboard");

  // 计算 7 天总数
  const totalThisWeek = data.reduce((sum, d) => sum + d.count, 0);

  // chartConfig 需要在组件内部定义，以便使用 t() 翻译
  const chartConfig = {
    count: {
      label: t("conversations"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-sm">{t("sevenDayTrend")}</CardTitle>
        <CardDescription>{t("trendDescription", { count: totalThisWeek })}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={formatShortDate}
              className="fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              allowDecimals={false}
              className="fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={formatShortDate} />} />
            <Area
              type="monotone"
              dataKey="count"
              fill="var(--chart-1)"
              fillOpacity={0.15}
              stroke="var(--chart-1)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
