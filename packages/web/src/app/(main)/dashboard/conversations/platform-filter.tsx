/**
 * 平台筛选组件
 *
 * Client Component — 因为需要处理用户交互（选择平台后修改 URL 参数）。
 * 使用 Next.js 的 useRouter + useSearchParams 来操作 URL，
 * 不会触发完整页面刷新，只会重新请求 Server Component 数据。
 */
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPlatformLabel } from "@/config/platform";

/** 支持筛选的平台列表（value 是平台标识，label 通过 getPlatformLabel 获取） */
const PLATFORM_VALUES = ["chatgpt", "claude", "claude-code", "deepseek", "gemini", "copilot", "cursor"] as const;

interface PlatformFilterProps {
  currentPlatform?: string;
}

export function PlatformFilter({ currentPlatform }: PlatformFilterProps) {
  const t = useTranslations("filter");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    // 构建新的 URL 参数
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("platform");
    } else {
      params.set("platform", value);
    }
    // 切换平台时重置到第 1 页
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentPlatform ?? "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={t("selectPlatform")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allPlatforms")}</SelectItem>
        {PLATFORM_VALUES.map((value) => (
          <SelectItem key={value} value={value}>
            {getPlatformLabel(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
