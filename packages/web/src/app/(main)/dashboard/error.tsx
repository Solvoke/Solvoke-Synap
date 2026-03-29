/**
 * 全局错误边界
 *
 * Client Component — Next.js 要求 error.tsx 必须是 Client Component。
 * 为什么需要：当页面渲染过程中抛出未捕获的异常时，
 * 显示友好的错误页面而非白屏，并提供重试按钮。
 */
"use client";

import { useEffect } from "react";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error("[Error] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold text-xl">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      <Button variant="outline" onClick={reset} className="gap-1">
        <RotateCcw className="size-4" />
        {tCommon("retry")}
      </Button>
    </div>
  );
}
