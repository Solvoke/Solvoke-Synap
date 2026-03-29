/**
 * 对话 schema 测试
 */
import { describe, it, expect } from 'vitest';

import { conversationSchema } from '../src/models/conversation.js';

// 测试用的合法对话数据
const validConversation = {
  id: 'conv_xyz789',
  platform: 'chatgpt' as const,
  title: '如何用 React 写一个 Todo App',
  messages: [
    {
      id: 'msg_1',
      role: 'user' as const,
      content: '帮我写一个 React Todo App',
      timestamp: '2026-02-24T10:00:00.000Z',
    },
    {
      id: 'msg_2',
      role: 'assistant' as const,
      content: '好的，这是一个简单的 React Todo App：\n```typescript\nconst App = () => {};\n```',
      timestamp: '2026-02-24T10:00:05.000Z',
      model: 'gpt-4o',
    },
  ],
  metadata: {
    externalId: 'chatgpt-conv-abc',
    messageCount: 2,
  },
  tags: ['react', 'tutorial'],
  createdAt: '2026-02-24T10:00:00.000Z',
  updatedAt: '2026-02-24T10:00:05.000Z',
};

describe('conversationSchema', () => {
  it('should 验证合法的对话数据', () => {
    const result = conversationSchema.safeParse(validConversation);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('conv_xyz789');
      expect(result.data.platform).toBe('chatgpt');
      expect(result.data.messages).toHaveLength(2);
      expect(result.data.tags).toEqual(['react', 'tutorial']);
    }
  });

  it('should 验证最小有效对话（空消息列表）', () => {
    const minimal = {
      id: 'conv_min',
      platform: 'claude',
      title: '空对话',
      messages: [],
      metadata: {},
      createdAt: '2026-02-24T10:00:00.000Z',
      updatedAt: '2026-02-24T10:00:00.000Z',
    };
    const result = conversationSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      // tags 应该有默认值 []
      expect(result.data.tags).toEqual([]);
    }
  });

  it('should 验证带 projectId 的对话', () => {
    const withProject = {
      ...validConversation,
      projectId: 'proj_synap',
    };
    const result = conversationSchema.safeParse(withProject);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe('proj_synap');
    }
  });

  it('should 拒绝无效的平台', () => {
    const result = conversationSchema.safeParse({
      ...validConversation,
      platform: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should 拒绝缺少 metadata 的对话', () => {
    const { metadata, ...noMeta } = validConversation;
    const result = conversationSchema.safeParse(noMeta);
    expect(result.success).toBe(false);
  });

  it('should 拒绝无效的时间戳', () => {
    const result = conversationSchema.safeParse({
      ...validConversation,
      createdAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('should 拒绝消息中包含无效数据的对话', () => {
    const result = conversationSchema.safeParse({
      ...validConversation,
      messages: [{ id: '', role: 'invalid', content: 123 }],
    });
    expect(result.success).toBe(false);
  });
});
