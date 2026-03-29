/**
 * 平台分布环形图
 *
 * 使用 recharts PieChart 展示各平台对话占比。
 * 为什么用 'use client'：recharts 需要浏览器端渲染。
 * 环形图（Donut）比实心饼图更现代，中心可放总数。
 */
"use client";

import { useTranslations } from "next-intl";
import { Cell, Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getPlatformColor, getPlatformLabel } from "@/config/platform";

interface PlatformChartProps {
  data: { platform: string; count: number }[];
  totalConversations: number;
}

export function PlatformChart({ data, totalConversations }: PlatformChartProps) {
  const t = useTranslations("dashboard");

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("platformDistribution")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-sm text-muted-foreground">{t("noDataYet")}</p>
        </CardContent>
      </Card>
    );
  }

  // 构建 recharts 数据，附加平台颜色
  const chartData = data.map((d) => ({
    name: getPlatformLabel(d.platform),
    value: d.count,
    fill: getPlatformColor(d.platform),
  }));

  // 为 ChartTooltip 构建 config
  const chartConfig: ChartConfig = {};
  for (const d of data) {
    chartConfig[d.platform] = {
      label: getPlatformLabel(d.platform),
      color: getPlatformColor(d.platform),
    };
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("platformDistribution")}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
              {/* 中心标签：显示总数 */}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} className="fill-foreground text-2xl font-bold">
                          {totalConversations.toLocaleString()}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 12} className="fill-muted-foreground text-xs">
                          {t("total")}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        {/* 图例：平台列表 */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5 text-xs">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
              <span className="text-muted-foreground">
                {entry.name} ({entry.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
