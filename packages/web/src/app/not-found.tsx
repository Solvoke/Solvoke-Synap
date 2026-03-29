"use client";

import Link from "next/link";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("error");
  const tCommon = useTranslations("common");

  return (
    <div className="flex h-dvh flex-col items-center justify-center space-y-2 text-center">
      <h1 className="font-semibold text-2xl">{t("pageNotFound")}</h1>
      <p className="text-muted-foreground">{t("pageNotFoundDescription")}</p>
      <Link prefetch={false} replace href="/dashboard">
        <Button variant="outline">{tCommon("backToHome")}</Button>
      </Link>
    </div>
  );
}
