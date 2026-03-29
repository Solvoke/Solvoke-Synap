/**
 * 格式化相对时间（i18n 版本）
 *
 * 提取为共享函数，消除 conversation-list、search page、
 * search-dialog、recent-conversations 中的重复实现。
 * 通过传入 next-intl 的 t() 函数实现多语言。
 */

/** 翻译函数类型 — 兼容 next-intl 的 useTranslations('time') 返回值 */
type TranslateFunction = (key: string, values?: Record<string, number>) => string;

/**
 * 将日期格式化为相对时间描述
 *
 * @param date - 目标日期（Date 对象或 ISO 字符串）
 * @param t - next-intl 翻译函数（命名空间为 'time'）
 * @returns 格式化后的相对时间字符串（如 "just now"、"3h ago"）
 */
export function formatRelativeTime(date: Date | string, t: TranslateFunction): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return t("justNow");
  if (diffMin < 60) return t("minutesAgo", { count: diffMin });
  if (diffHour < 24) return t("hoursAgo", { count: diffHour });
  if (diffDay < 30) return t("daysAgo", { count: diffDay });
  return dateObj.toLocaleDateString();
}
