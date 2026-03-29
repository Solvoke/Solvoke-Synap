/**
 * 同步负载 schema 测试
 */
import { describe, it, expect } from 'vitest';

import { syncRequestSchema, syncResponseSchema } from '../src/models/sync.js';

const validSyncRequest = {
  platform: 'chatgpt' as const,
  conversations: [
    {
      id: 'conv_1',
      platform: 'chatgpt' as const,
      title: '测试对话',
      messages: [
        {
          id: 'msg_1',
          role: 'user' as const,
          content: '你好',
          timestamp: '2026-02-24T10:00:00.000Z',
        },
      ],
      metadata: { messageCount: 1 },
      createdAt: '2026-02-24T10:00:00.000Z',
      updatedAt: '2026-02-24T10:00:00.000Z',
    },
  ],
  clientTimestamp: '2026-02-24T10:00:00.000Z',
};

describe('syncRequestSchema', () => {
  it('should 验证合法的同步请求', () => {
    const result = syncRequestSchema.safeParse(validSyncRequest);
    expect(result.success).toBe(true);
  });

  it('should 拒绝空的对话列表', () => {
    const result = syncRequestSchema.safeParse({
      ...validSyncRequest,
      conversations: [],
    });
    expect(result.success).toBe(false);
  });

  it('should 拒绝缺少 clientTimestamp', () => {
    const { clientTimestamp, ...noTs } = validSyncRequest;
    const result = syncRequestSchema.safeParse(noTs);
    expect(result.success).toBe(false);
  });

  it('should 拒绝超过 50 条对话的请求', () => {
    const tooMany = {
      ...validSyncRequest,
      conversations: Array.from({ length: 51 }, (_, i) => ({
        ...validSyncRequest.conversations[0],
        id: `conv_${i}`,
      })),
    };
    const result = syncRequestSchema.safeParse(tooMany);
    expect(result.success).toBe(false);
  });
});

describe('syncResponseSchema', () => {
  it('should 验证成功的同步响应', () => {
    const response = {
      success: true,
      results: [
        { conversationId: 'conv_1', status: 'created' },
      ],
      serverTimestamp: '2026-02-24T10:00:01.000Z',
    };
    const result = syncResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should 验证带错误的同步响应', () => {
    const response = {
      success: false,
      results: [],
      serverTimestamp: '2026-02-24T10:00:01.000Z',
      error: 'Internal server error',
    };
    const result = syncResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should 验证所有状态值', () => {
    const response = {
      success: true,
      results: [
        { conversationId: 'conv_1', status: 'created' },
        { conversationId: 'conv_2', status: 'updated' },
        { conversationId: 'conv_3', status: 'skipped' },
      ],
      serverTimestamp: '2026-02-24T10:00:01.000Z',
    };
    const result = syncResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
