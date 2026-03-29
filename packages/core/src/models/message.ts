/**
 * 消息模型
 *
 * 代表 AI 对话中的单条消息（对应一次 user 输入或一次 assistant 回复）。
 * role 使用 'user' | 'assistant' | 'system' 三种角色，
 * 与 OpenAI/Claude 等 API 的角色定义一致。
 */
import { z } from 'zod';

import { codeBlockSchema } from './code-block.js';

/** 消息角色 schema */
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

/** 消息角色类型 */
export type MessageRole = z.infer<typeof messageRoleSchema>;

/** 消息 schema */
export const messageSchema = z.object({
  /** 消息唯一 ID（nanoid 生成） */
  id: z.string().min(1),
  /** 角色：用户 / AI 助手 / 系统 */
  role: messageRoleSchema,
  /** 消息文本内容（通常是 Markdown 格式） */
  content: z.string(),
  /** 从内容中提取的代码块（可选，由工具函数解析后填充） */
  codeBlocks: z.array(codeBlockSchema).optional(),
  /** 消息时间戳（ISO 8601 格式） */
  timestamp: z.string().datetime(),
  /** AI 模型名称，如 "gpt-4o"、"claude-3.5-sonnet"（可选） */
  model: z.string().optional(),
  /** Token 消耗数（可选，并非所有平台都提供） */
  tokenCount: z.number().int().nonnegative().optional(),
});

/** 单条消息类型 */
export type Message = z.infer<typeof messageSchema>;
