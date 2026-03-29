/**
 * @synap/core — Synap 共享核心库
 *
 * 所有子项目通过这个入口引用类型、schema、工具函数和常量：
 *
 * ```typescript
 * import {
 *   type Conversation,
 *   conversationSchema,
 *   generateId,
 *   ok,
 *   err,
 *   DEFAULT_SERVER_URL
 * } from '@synap/core';
 * ```
 */

// ========== 数据模型 & Schema ==========
export {
  // 平台
  platformSchema,
  type Platform,
  PLATFORMS,
  // 代码块
  codeBlockSchema,
  type CodeBlock,
  // 消息
  messageSchema,
  messageRoleSchema,
  type Message,
  type MessageRole,
  // 对话元数据
  conversationMetaSchema,
  type ConversationMeta,
  // 对话
  conversationSchema,
  type Conversation,
  // 同步
  syncRequestSchema,
  syncResponseSchema,
  syncResultItemSchema,
  syncResultStatusSchema,
  type SyncRequest,
  type SyncResponse,
  type SyncResultStatus,
} from './models/index.js';

// ========== Result 模式 ==========
export { type Result, ok, err } from './result.js';

// ========== 错误处理 ==========
export { ErrorCode, SynapError, type ErrorCode as ErrorCodeType } from './errors.js';

// ========== 工具函数 ==========
export {
  generateId,
  nowISO,
  formatTimestamp,
  formatRelativeTime,
  extractCodeBlocks,
  truncateContent,
  countCodeBlocks,
} from './utils/index.js';

// ========== 常量 ==========
export {
  APP_VERSION,
  VERSION_CHECK_URL,
  VERSION_CHECK_INTERVAL_MS,
  DEFAULT_SERVER_URL,
  API_ENDPOINTS,
  CLIENT_HEADER,
  API_KEY_PREFIX,
  API_KEY_LENGTH,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_SYNC_CONVERSATIONS,
  MAX_SYNC_BODY_SIZE,
  MAX_TITLE_LENGTH,
  PREVIEW_CONTENT_LENGTH,
  REQUEST_TIMEOUT_MS,
  HEALTH_CHECK_TIMEOUT_MS,
  VERSION_CHECK_TIMEOUT_MS,
  SYNC_RETRY_BASE_MS,
  MAX_SYNC_RETRIES,
  AUTO_SYNC_INTERVAL_MS,
  DEFAULT_SYNC_INTERVAL_SEC,
  MIN_SYNC_INTERVAL_SEC,
  DEFAULT_AUTO_SYNC,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ID_LENGTH,
} from './constants.js';
