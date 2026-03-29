/**
 * 语言切换器组件
 *
 * 通过设置 NEXT_LOCALE cookie 切换语言，刷新页面使新语言生效。
 * 为什么用 cookie 而非 URL 前缀：Synap 是自部署工具，不需要 SEO，
 * URL 保持简洁（/dashboard 而非 /en/dashboard）更重要。
 */
"use client";

import { useRouter } from "next/navigation";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_COOKIE_NAME, LOCALE_LABELS, type Locale, SUPPORTED_LOCALES } from "@/i18n/config";

export function LocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();

  function handleLocaleChange(locale: Locale) {
    if (locale === currentLocale) return;

    // 设置 cookie（maxAge 1 年）
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=31536000;SameSite=Lax`;

    // 刷新页面使新语言生效
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-muted-foreground">
          <Languages className="size-3.5" />
          <span>{LOCALE_LABELS[currentLocale as Locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={locale === currentLocale ? "font-medium" : ""}
          >
            {LOCALE_LABELS[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
