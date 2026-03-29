/**
 * 消息 schema 测试
 */
import { describe, it, expect } from 'vitest';

import { messageSchema, messageRoleSchema } from '../src/models/message.js';

// 测试用的合法消息数据
const validMessage = {
  id: 'msg_abc123',
  role: 'user' as const,
  content: '帮我写一个 React 组件',
  timestamp: '2026-02-24T10:30:00.000Z',
};

describe('messageRoleSchema', () => {
  it('should 验证所有合法角色', () => {
    expect(messageRoleSchema.safeParse('user').success).toBe(true);
    expect(messageRoleSchema.safeParse('assistant').success).toBe(true);
    expect(messageRoleSchema.safeParse('system').success).toBe(true);
  });

  it('should 拒绝未知角色', () => {
    expect(messageRoleSchema.safeParse('admin').success).toBe(false);
    expect(messageRoleSchema.safeParse('tool').success).toBe(false);
  });
});

describe('messageSchema', () => {
  it('should 验证合法的消息数据', () => {
    const result = messageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('msg_abc123');
      expect(result.data.role).toBe('user');
    }
  });

  it('should 验证带可选字段的完整消息', () => {
    const fullMessage = {
      ...validMessage,
      role: 'assistant',
      model: 'gpt-4o',
      tokenCount: 150,
      codeBlocks: [
        { language: 'typescript', code: 'const x = 1;', startIndex: 10 },
      ],
    };
    const result = messageSchema.safeParse(fullMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('gpt-4o');
      expect(result.data.tokenCount).toBe(150);
      expect(result.data.codeBlocks).toHaveLength(1);
    }
  });

  it('should 拒绝空 ID', () => {
    const result = messageSchema.safeParse({ ...validMessage, id: '' });
    expect(result.success).toBe(false);
  });

  it('should 拒绝无效的时间戳', () => {
    const result = messageSchema.safeParse({ ...validMessage, timestamp: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('should 拒绝负数的 tokenCount', () => {
    const result = messageSchema.safeParse({ ...validMessage, tokenCount: -1 });
    expect(result.success).toBe(false);
  });

  it('should 拒绝缺少必填字段', () => {
    const { id, ...noId } = validMessage;
    expect(messageSchema.safeParse(noId).success).toBe(false);

    const { role, ...noRole } = validMessage;
    expect(messageSchema.safeParse(noRole).success).toBe(false);

    const { content, ...noContent } = validMessage;
    expect(messageSchema.safeParse(noContent).success).toBe(false);
  });
});
