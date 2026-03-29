/**
 * 分页组件
 *
 * Client Component — 需要处理用户点击翻页。
 * 修改 URL 的 page 参数触发 Server Component 重新获取数据。
 */
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface ConversationPaginationProps {
  currentPage: number;
  totalPages: number;
  platform?: string;
}

export function ConversationPagination({ currentPage, totalPages }: ConversationPaginationProps) {
  const t = useTranslations("pagination");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
        {t("previous")}
      </Button>
      <span className="text-muted-foreground text-sm">{t("pageOf", { current: currentPage, total: totalPages })}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        {t("next")}
      </Button>
    </div>
  );
}
