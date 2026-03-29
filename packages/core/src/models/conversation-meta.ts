/**
 * 对话元数据模型
 *
 * 存放对话的附加信息，与核心字段分开是为了便于扩展。
 * 比如后续可以增加 token 总数统计、对话质量评分等，不影响主模型结构。
 */
import { z } from 'zod';

/** 对话元数据 schema */
export const conversationMetaSchema = z.object({
  /** 原始平台的对话 ID（用于去重和溯源） */
  externalId: z.string().optional(),
  /** 原始平台的对话 URL（可选） */
  url: z.string().url().optional(),
  /** 消息总数（冗余字段，方便列表展示时不需要加载全部消息） */
  messageCount: z.number().int().nonnegative().default(0),
  /** 使用的 AI 模型（对话级别，可能随消息变化） */
  model: z.string().optional(),
  /** 关联的工作区/项目名称（来自 IDE 插件） */
  workspace: z.string().optional(),
});

/** 对话元数据类型 */
export type ConversationMeta = z.infer<typeof conversationMetaSchema>;
