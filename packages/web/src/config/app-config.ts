import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Solvoke Synap",
  version: packageJson.version,
  copyright: `© ${currentYear}, Solvoke Synap.`,
  meta: {
    title: "Solvoke Synap — AI Conversation Manager",
    description:
      "Cross-platform AI conversation manager. Bridge IDE and Web, enabling local-first backup, cross-platform search, and project-level organization.",
  },
};

/**
 * 版本检查相关常量（复制自 @synap/core/constants）
 *
 * 为什么不直接从 @synap/core 导入：
 * @synap/core 在 next.config.mjs 中配置为 serverExternalPackages，
 * 只在服务端组件（Server Components / API Routes）中可用。
 * VersionCheckBanner 是 Client Component，Turbopack 无法解析 symlink 依赖。
 * 所以在此处复制一份，保持值与 @synap/core 一致即可。
 */
export const VERSION_CHECK_URL = "https://synapdemo.solvoke.com/version.json";

/** 版本检查间隔：2 小时 */
export const VERSION_CHECK_INTERVAL_MS = 2 * 60 * 60 * 1000;
