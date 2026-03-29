/**
 * 对话来源平台
 *
 * 定义了 Synap 支持采集的所有 AI 对话平台。
 * 为什么用 zod enum 而不是 TypeScript enum：
 * - zod enum 可以同时做运行时校验和类型推导
 * - TypeScript enum 在编译后会变成对象，增加包体积
 */
import { z } from 'zod';

/** 平台 schema — 用于运行时验证 */
export const platformSchema = z.enum([
  'chatgpt',
  'claude',
  'claude-code',
  'deepseek',
  'gemini',
  'copilot',
  'cursor',
]);

/** 对话来源平台类型 */
export type Platform = z.infer<typeof platformSchema>;

/** 所有支持的平台列表（运行时可用） */
export const PLATFORMS = platformSchema.options;
