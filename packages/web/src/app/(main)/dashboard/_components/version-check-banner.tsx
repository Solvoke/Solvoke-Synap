/**
 * 版本检查横幅组件（Client Component）
 *
 * 在 Dashboard 顶部检查远程 version.json，与当前 Web 版本比对。
 * 如果有新版本可用，展示一条横幅提示用户升级。
 *
 * 为什么是 Client Component：
 * - 需要 fetch 外部 URL（version.json 在公网服务器上）
 * - 需要 localStorage 记录上次检查时间，避免频繁请求
 * - 需要用户交互（关闭横幅）
 */
"use client";

import { useEffect, useState } from "react";

import { ArrowUpRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { APP_CONFIG, VERSION_CHECK_INTERVAL_MS, VERSION_CHECK_URL } from "@/config/app-config";

/** localStorage 键名 */
const STORAGE_KEY_LAST_CHECK = "synap_version_last_check";
const STORAGE_KEY_DISMISSED = "synap_version_dismissed";

/** 远程 version.json 中 web 部分的类型 */
interface RemoteVersionInfo {
  latest: string;
  minCompatible: string;
  releaseUrl?: string;
  changelog?: string;
}

/**
 * 简单的语义版本比较：a < b 返回 true
 * 只比较 major.minor.patch，不处理 pre-release
 */
function isVersionOlder(current: string, latest: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);

  if (cMajor !== lMajor) return cMajor < lMajor;
  if (cMinor !== lMinor) return cMinor < lMinor;
  return cPatch < lPatch;
}

export function VersionCheckBanner() {
  const t = useTranslations("versionCheck");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 检查用户是否已关闭过当前版本的提示
    const dismissedVersion = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedVersion) {
      setDismissed(true);
    }

    // 检查是否在检查间隔内
    const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
    if (lastCheck) {
      const elapsed = Date.now() - Number(lastCheck);
      if (elapsed < VERSION_CHECK_INTERVAL_MS) {
        return;
      }
    }

    // 发起远程版本检查
    const controller = new AbortController();
    fetch(VERSION_CHECK_URL, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { web?: RemoteVersionInfo }) => {
        localStorage.setItem(STORAGE_KEY_LAST_CHECK, String(Date.now()));

        const webInfo = data.web;
        if (!webInfo?.latest) return;

        if (isVersionOlder(APP_CONFIG.version, webInfo.latest)) {
          setLatestVersion(webInfo.latest);
          setReleaseUrl(webInfo.releaseUrl ?? null);

          // 如果新版本与之前关闭的版本不同，重置 dismissed 状态
          if (dismissedVersion !== webInfo.latest) {
            setDismissed(false);
            localStorage.removeItem(STORAGE_KEY_DISMISSED);
          }
        }
      })
      .catch(() => {
        // 版本检查失败不影响正常使用，静默忽略
        // 常见原因：网络不通、version.json 不可达
      });

    return () => controller.abort();
  }, []);

  // 无新版本或已关闭 → 不渲染
  if (!latestVersion || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY_DISMISSED, latestVersion);
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm dark:border-blue-800 dark:bg-blue-950/50">
      <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
        <span>{t("newVersion", { version: latestVersion })}</span>
        {releaseUrl && (
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2 hover:no-underline"
          >
            {t("viewRelease")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded p-0.5 text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
        aria-label={t("dismiss")}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
