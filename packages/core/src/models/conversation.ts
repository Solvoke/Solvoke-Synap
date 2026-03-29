/**
 * 对话模型 — Synap 的核心数据结构
 *
 * 一个 Conversation 代表一次完整的 AI 对话，包含多条 Message。
 * 它是所有子项目之间数据交换的标准格式：
 * - Chrome 插件拦截到的对话数据 → 解析成 Conversation → 发送到 Web
 * - VSCode 插件读取的对话数据 → 解析成 Conversation → 发送到 Web
 * - Web Dashboard 从数据库读取 → Conversation → 前端渲染
 */
import { z } from 'zod';

import { conversationMetaSchema } from './conversation-meta.js';
import { messageSchema } from './message.js';
import { platformSchema } from './platform.js';

/** 对话 schema */
export const conversationSchema = z.object({
  /** 对话唯一 ID（nanoid 生成） */
  id: z.string().min(1),
  /** 来源平台 */
  platform: platformSchema,
  /** 对话标题（通常是第一条用户消息的摘要或平台生成的标题） */
  title: z.string(),
  /** 消息列表 */
  messages: z.array(messageSchema),
  /** 元数据（URL、外部 ID 等附加信息） */
  metadata: conversationMetaSchema,
  /** 用户自定义标签 */
  tags: z.array(z.string()).default([]),
  /** 关联的项目 ID（可选，用于按项目组织对话） */
  projectId: z.string().optional(),
  /** 对话创建时间（ISO 8601） */
  createdAt: z.string().datetime(),
  /** 对话最后更新时间（ISO 8601） */
  updatedAt: z.string().datetime(),
});

/** 对话类型 */
export type Conversation = z.infer<typeof conversationSchema>;
