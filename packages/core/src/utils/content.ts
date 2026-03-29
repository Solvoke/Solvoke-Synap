/**
 * 内容处理工具
 *
 * 包含 Markdown 代码块提取和文本截断等功能。
 * extractCodeBlocks 是 Synap 的核心工具函数之一，
 * 用于从 AI 回复（Markdown 格式）中拆分出代码块。
 */
import type { CodeBlock } from '../models/code-block.js';

/**
 * 从 Markdown 内容中提取代码块
 *
 * 匹配 ```language\ncode\n``` 格式的代码块。
 * 支持带语言标记和不带语言标记两种格式。
 *
 * @param content Markdown 格式的文本内容
 * @returns 提取到的代码块数组
 *
 * @example
 * ```typescript
 * const blocks = extractCodeBlocks('some text\n```typescript\nconst x = 1;\n```\nmore text');
 * // [{ language: 'typescript', code: 'const x = 1;', startIndex: 10 }]
 * ```
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];

  // 正则说明：
  // ```(\w*)\n — 开头 ``` 后可选的语言标记，然后换行
  // ([\s\S]*?) — 非贪婪匹配代码内容（包括换行）
  // \n``` — 结尾的换行 + ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;

  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    blocks.push({
      language: match[1] ?? '',
      code: match[2] ?? '',
      startIndex: match.index,
    });
  }

  return blocks;
}

/**
 * 截断文本内容用于预览
 *
 * @param content 原始内容
 * @param maxLength 最大长度（默认 200 字符）
 * @returns 截断后的文本，超长时末尾加 "..."
 */
export function truncateContent(content: string, maxLength: number = 200): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.slice(0, maxLength) + '...';
}

/**
 * 计算文本中的代码块数量（轻量版，不做完整解析）
 *
 * @param content Markdown 格式的文本内容
 * @returns 代码块数量
 */
export function countCodeBlocks(content: string): number {
  const matches = content.match(/```\w*\n[\s\S]*?\n```/g);
  return matches ? matches.length : 0;
}
