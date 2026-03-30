/**
 * 工具函数测试 — ID 生成
 */
import { describe, it, expect } from 'vitest';

import { generateId } from '../src/utils/id.js';

describe('generateId', () => {
  it('should 生成 21 位默认长度的 ID', () => {
    const id = generateId();
    expect(id).toHaveLength(21);
  });

  it('should 支持自定义长度', () => {
    expect(generateId(10)).toHaveLength(10);
    expect(generateId(32)).toHaveLength(32);
  });

  it('should 生成唯一的 ID（连续调用不重复）', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it('should 只包含 URL 安全字符', () => {
    const id = generateId();
    // nanoid 默认字符集：A-Za-z0-9_-
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
