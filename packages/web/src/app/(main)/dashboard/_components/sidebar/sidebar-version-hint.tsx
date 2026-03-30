/**
 * Sidebar version update indicator (Client Component)
 *
 * Displayed in the sidebar footer next to the version number.
 * When a new version is available, shows a pulsing dot and the version info.
 * Unlike the old banner, this indicator never disappears — it stays visible
 * until the user actually upgrades.
 *
 * Design: Subtle but persistent — inspired by Linear/Figma update hints.
 */
"use client";

import { useEffect, useState } from "react";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { APP_CONFIG, VERSION_CHECK_INTERVAL_MS, VERSION_CHECK_URL } from "@/config/app-config";

/** localStorage key for caching last check timestamp */
const STORAGE_KEY_LAST_CHECK = "synap_version_last_check";
const STORAGE_KEY_LATEST = "synap_version_latest";
const STORAGE_KEY_RELEASE_URL = "synap_version_release_url";

interface RemoteVersionInfo {
  latest: string;
  minCompatible: string;
  releaseUrl?: string;
  changelog?: string;
}

function isVersionOlder(current: string, latest: string): boolean {
  const parse = (v: string) => v.split(".").map(Number);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parse(current);
  const [lMajor = 0, lMinor = 0, lPatch = 0] = parse(latest);

  if (cMajor !== lMajor) return cMajor < lMajor;
  if (cMinor !== lMinor) return cMinor < lMinor;
  return cPatch < lPatch;
}

export function SidebarVersionHint() {
  const t = useTranslations("versionCheck");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null);

  useEffect(() => {
    // First, restore cached version info so the hint appears instantly on reload
    const cachedLatest = localStorage.getItem(STORAGE_KEY_LATEST);
    const cachedUrl = localStorage.getItem(STORAGE_KEY_RELEASE_URL);
    if (cachedLatest && isVersionOlder(APP_CONFIG.version, cachedLatest)) {
      setLatestVersion(cachedLatest);
      setReleaseUrl(cachedUrl);
    }

    // Check if we need to fetch
    const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK);
    if (lastCheck) {
      const elapsed = Date.now() - Number(lastCheck);
      if (elapsed < VERSION_CHECK_INTERVAL_MS) {
        return;
      }
    }

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
          // Cache for instant display on next page load
          localStorage.setItem(STORAGE_KEY_LATEST, webInfo.latest);
          if (webInfo.releaseUrl) {
            localStorage.setItem(STORAGE_KEY_RELEASE_URL, webInfo.releaseUrl);
          }
        } else {
          // Current version is up to date — clear cached info
          setLatestVersion(null);
          localStorage.removeItem(STORAGE_KEY_LATEST);
          localStorage.removeItem(STORAGE_KEY_RELEASE_URL);
        }
      })
      .catch(() => {
        // Silent fail — version check is non-critical
      });

    return () => controller.abort();
  }, []);

  // No update available — just show current version
  if (!latestVersion) {
    return <span className="text-muted-foreground text-xs">v{APP_CONFIG.version}</span>;
  }

  // Update available — show version with indicator dot and link
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        <span className="text-muted-foreground text-xs">v{APP_CONFIG.version}</span>
      </div>
      <div className="flex items-center gap-1 text-blue-600 text-xs dark:text-blue-400">
        <span>{t("newVersion", { version: latestVersion })}</span>
        {releaseUrl && (
          <a
            href={releaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 hover:underline"
          >
            {t("viewRelease")}
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
