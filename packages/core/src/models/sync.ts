/**
 * 同步负载模型
 *
 * 定义了插件 → Web 数据同步的请求和响应格式。
 * Chrome 插件和 VSCode 插件都通过 POST /api/sync 上报数据，
 * 请求体就是 SyncRequest，响应体就是 SyncResponse。
 */
import { z } from 'zod';

import { conversationSchema } from './conversation.js';
import { platformSchema } from './platform.js';

/** 单次同步最大对话数（与 constants.ts MAX_SYNC_CONVERSATIONS 保持一致） */
const MAX_CONVERSATIONS_PER_SYNC = 50;

/** 同步请求 schema */
export const syncRequestSchema = z.object({
  /** 数据来源平台 */
  platform: platformSchema,
  /** 要同步的对话列表（支持批量，最多 50 条） */
  conversations: z.array(conversationSchema).min(1).max(MAX_CONVERSATIONS_PER_SYNC),
  /** 客户端时间戳（用于排查时差问题） */
  clientTimestamp: z.string().datetime(),
});

/** 同步请求类型 */
export type SyncRequest = z.infer<typeof syncRequestSchema>;

/** 同步结果状态 */
export const syncResultStatusSchema = z.enum(['created', 'updated', 'skipped']);
export type SyncResultStatus = z.infer<typeof syncResultStatusSchema>;

/** 单条对话的同步结果 */
export const syncResultItemSchema = z.object({
  /** 对话 ID */
  conversationId: z.string(),
  /** 处理状态 */
  status: syncResultStatusSchema,
});

/** 同步响应 schema */
export const syncResponseSchema = z.object({
  /** 是否全部成功 */
  success: z.boolean(),
  /** 每条对话的处理结果 */
  results: z.array(syncResultItemSchema),
  /** 服务端时间戳 */
  serverTimestamp: z.string().datetime(),
  /** 错误消息（仅在 success=false 时有值） */
  error: z.string().optional(),
});

/** 同步响应类型 */
export type SyncResponse = z.infer<typeof syncResponseSchema>;
