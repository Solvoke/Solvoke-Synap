/**
 * 数据模型统一导出
 *
 * 所有模型从这里重新导出，方便消费方引用：
 * import { type Conversation, conversationSchema } from '@synap/core';
 */

// 平台
export { platformSchema, type Platform, PLATFORMS } from './platform.js';

// 代码块
export { codeBlockSchema, type CodeBlock } from './code-block.js';

// 消息
export {
  messageSchema,
  messageRoleSchema,
  type Message,
  type MessageRole,
} from './message.js';

// 对话元数据
export { conversationMetaSchema, type ConversationMeta } from './conversation-meta.js';

// 对话
export { conversationSchema, type Conversation } from './conversation.js';

// 同步负载
export {
  syncRequestSchema,
  syncResponseSchema,
  syncResultItemSchema,
  syncResultStatusSchema,
  type SyncRequest,
  type SyncResponse,
  type SyncResultStatus,
} from './sync.js';
