/**
 * 代码块模型
 *
 * 从对话内容（Markdown 格式）中提取的代码块。
 * 为什么单独定义：代码块是 Synap 区别于普通对话记录工具的关键数据，
 * 后续可基于它做代码搜索、跨对话代码对比等功能。
 */
import { z } from 'zod';

/** 代码块 schema */
export const codeBlockSchema = z.object({
  /** 编程语言（来自 Markdown 的 ```language 标记） */
  language: z.string().default(''),
  /** 代码内容 */
  code: z.string(),
  /** 在原始消息内容中的起始位置（可选，方便定位） */
  startIndex: z.number().int().nonnegative().optional(),
});

/** 代码块类型 */
export type CodeBlock = z.infer<typeof codeBlockSchema>;
