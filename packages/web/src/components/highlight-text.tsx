/**
 * 关键词高亮组件
 *
 * 将文本中匹配关键词的部分用 <mark> 标签包裹，实现视觉高亮。
 * 为什么用正则而不是简单 split：需要支持大小写不敏感匹配，
 * 且保留原文的大小写形式。
 */

interface HighlightTextProps {
  text: string;
  keyword: string;
  /** 高亮标记的 CSS 类名，默认使用黄色背景 */
  className?: string;
}

export function HighlightText({ text, keyword, className }: HighlightTextProps) {
  if (!keyword || !text) {
    return <>{text}</>;
  }

  // 转义正则特殊字符，防止关键词中有 . * + 等导致匹配异常
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) {
    // 没有匹配到关键词，直接返回原文
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={className ?? "rounded-sm bg-yellow-200 px-0.5 dark:bg-yellow-800 dark:text-yellow-100"}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
