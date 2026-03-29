/**
 * 平台 schema 测试
 */
import { describe, it, expect } from 'vitest';

import { platformSchema, PLATFORMS } from '../src/models/platform.js';

describe('platformSchema', () => {
  it('should 验证所有合法的平台名', () => {
    const validPlatforms = ['chatgpt', 'claude', 'claude-code', 'deepseek', 'gemini', 'copilot', 'cursor'];
    for (const platform of validPlatforms) {
      const result = platformSchema.safeParse(platform);
      expect(result.success).toBe(true);
    }
  });

  it('should 拒绝未知平台', () => {
    const result = platformSchema.safeParse('unknown-platform');
    expect(result.success).toBe(false);
  });

  it('should 拒绝空字符串', () => {
    const result = platformSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('should 拒绝非字符串类型', () => {
    expect(platformSchema.safeParse(123).success).toBe(false);
    expect(platformSchema.safeParse(null).success).toBe(false);
    expect(platformSchema.safeParse(undefined).success).toBe(false);
  });

  it('should 导出所有平台列表', () => {
    expect(PLATFORMS).toEqual(['chatgpt', 'claude', 'claude-code', 'deepseek', 'gemini', 'copilot', 'cursor']);
    expect(PLATFORMS.length).toBe(7);
  });
});
