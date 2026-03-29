/**
 * i18n 配置常量
 *
 * 为什么用 cookie-based 模式（无 URL 前缀）而非 [locale] 路由段：
 * Synap 是自部署 Dashboard 工具，不需要 SEO，URL 保持简洁更重要。
 * 语言偏好通过 cookie 存储，切换时设置 NEXT_LOCALE cookie。
 */

/** 支持的语言列表 */
export const SUPPORTED_LOCALES = ["en", "zh-CN"] as const;

/** 语言类型 */
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** 默认语言 */
export const DEFAULT_LOCALE: Locale = "en";

/** cookie 名称（next-intl 约定） */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** 语言显示名称（用于语言切换器） */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-CN": "中文",
};
