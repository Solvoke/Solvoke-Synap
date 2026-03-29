/**
 * 平台相关常量
 *
 * 集中管理各平台的显示名称和品牌颜色，避免在多个组件中重复定义。
 */

/** 平台显示名称 */
export const PLATFORM_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  "claude-code": "Claude Code",
  deepseek: "DeepSeek",
  gemini: "Gemini",
  copilot: "Copilot",
  cursor: "Cursor",
};

/**
 * 平台品牌颜色（用于图表和装饰元素）
 *
 * 选色原则：使用各平台官方品牌色的主色调，
 * 在亮暗模式下都能保持足够对比度。
 */
export const PLATFORM_COLOR: Record<string, string> = {
  chatgpt: "#10a37f",
  claude: "#d97757",
  "claude-code": "#b45309",
  deepseek: "#4d6bfe",
  gemini: "#8b5cf6",
  copilot: "#6366f1",
  cursor: "#22d3ee",
};

/** 获取平台显示名称，找不到时返回原始值 */
export function getPlatformLabel(platform: string): string {
  return PLATFORM_LABEL[platform] ?? platform;
}

/** 获取平台颜色，找不到时返回默认灰色 */
export function getPlatformColor(platform: string): string {
  return PLATFORM_COLOR[platform] ?? "#6b7280";
}
