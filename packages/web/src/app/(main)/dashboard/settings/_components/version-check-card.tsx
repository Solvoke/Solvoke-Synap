/**
 * 手动版本检查卡片（Client Component）
 *
 * 在设置页面中展示当前版本信息，并提供手动检查更新按钮。
 * 手动检查会绕过 24 小时缓存，直接请求 version.json。
 *
 * 为什么是 Client Component：
 * - 需要 fetch 外部 URL（version.json）
 * - 需要用户交互（点击检查按钮）
 * - 需要 state 管理加载/结果状态
 */
"use client";

import { useState } from "react";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CONFIG, VERSION_CHECK_URL } from "@/config/app-config";

/** 检查结果状态 */
type CheckResult =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "up-to-date" }
  | { status: "update-available"; latest: string; releaseUrl?: string }
  | { status: "error" };

/**
 * 简单的语义版本比较：a < b 返回 true
 * 与 version-check-banner.tsx 中的逻辑一致
 */
function isVersionOlder(current: string, latest: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);

  if (cMajor !== lMajor) return cMajor < lMajor;
  if (cMinor !== lMinor) return cMinor < lMinor;
  return cPatch < lPatch;
}

export function VersionCheckCard() {
  const t = useTranslations("settings.versionCheck");
  const [result, setResult] = useState<CheckResult>({ status: "idle" });

  async function handleCheck() {
    setResult({ status: "checking" });

    try {
      const res = await fetch(VERSION_CHECK_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const webInfo = data.web;

      if (!webInfo?.latest) {
        setResult({ status: "error" });
        return;
      }

      if (isVersionOlder(APP_CONFIG.version, webInfo.latest)) {
        setResult({
          status: "update-available",
          latest: webInfo.latest,
          releaseUrl: webInfo.releaseUrl,
        });
      } else {
        setResult({ status: "up-to-date" });
      }
    } catch {
      setResult({ status: "error" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前版本 */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">{t("currentVersion", { version: APP_CONFIG.version })}</span>
          <Button variant="outline" size="sm" onClick={handleCheck} disabled={result.status === "checking"}>
            <RefreshCw className={`mr-2 h-4 w-4 ${result.status === "checking" ? "animate-spin" : ""}`} />
            {result.status === "checking" ? t("checking") : t("checkNow")}
          </Button>
        </div>

        {/* 检查结果 */}
        {result.status === "up-to-date" && (
          <p className="text-green-600 text-sm dark:text-green-400">{t("upToDate")}</p>
        )}

        {result.status === "update-available" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-800 dark:bg-blue-950/50">
            <p className="text-blue-800 dark:text-blue-200">{t("updateAvailable", { latest: result.latest })}</p>
            {result.releaseUrl && (
              <a
                href={result.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-blue-600 underline underline-offset-2 hover:no-underline dark:text-blue-400"
              >
                {t("viewRelease")}
              </a>
            )}
          </div>
        )}

        {result.status === "error" && <p className="text-destructive text-sm">{t("checkFailed")}</p>}
      </CardContent>
    </Card>
  );
}
