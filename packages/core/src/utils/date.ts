/**
 * 日期工具函数
 *
 * 统一使用 ISO 8601 格式的字符串表示时间。
 * 为什么不用 Date 对象：
 * - JSON 序列化/反序列化时 Date 对象会丢失，需要额外处理
 * - zod 的 z.string().datetime() 可以直接校验 ISO 8601 字符串
 * - 在数据库中字符串存储更简单
 */

/** 获取当前时间的 ISO 8601 字符串 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * 将时间戳格式化为可读的本地时间
 * @param isoString ISO 8601 格式的时间字符串
 * @returns 格式化后的本地时间字符串，如 "2026-02-24 15:30"
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '无效日期';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 将时间戳格式化为相对时间描述
 * @param isoString ISO 8601 格式的时间字符串
 * @returns 相对时间描述，如 "刚刚"、"5分钟前"、"2小时前"、"昨天"
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '无效日期';
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  // 未来时间
  if (diffMs < 0) {
    return formatTimestamp(isoString);
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;

  // 超过 30 天显示完整日期
  return formatTimestamp(isoString);
}
