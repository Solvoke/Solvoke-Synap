/**
 * 设置页面
 *
 * Server Component — 从数据库获取 API Key 列表展示。
 * 包含 API Key 管理功能：生成、复制、删除。
 */
import { getTranslations } from "next-intl/server";

import { getApiKeys } from "@/lib/db/queries";

import { ApiKeyManager } from "./_components/api-key-manager";
import { VersionCheckCard } from "./_components/version-check-card";

export default async function SettingsPage() {
  const [apiKeys, t] = await Promise.all([getApiKeys(), getTranslations("settings")]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {/* 版本检查 */}
      <VersionCheckCard />

      {/* API Key 管理区块 */}
      <ApiKeyManager initialKeys={apiKeys} />
    </div>
  );
}
