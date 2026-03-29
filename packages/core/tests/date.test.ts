/**
 * 工具函数测试 — 日期工具
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { nowISO, formatTimestamp, formatRelativeTime } from '../src/utils/date.js';

describe('nowISO', () => {
  it('should 返回合法的 ISO 8601 字符串', () => {
    const iso = nowISO();
    // ISO 8601 格式可以被 Date 正确解析
    const date = new Date(iso);
    expect(date.getTime()).not.toBeNaN();
    // ISO 字符串以 Z 结尾（UTC 时间）
    expect(iso).toMatch(/Z$/);
  });
});

describe('formatTimestamp', () => {
  it('should 格式化合法的时间戳', () => {
    // 注意：这个时间是 UTC，显示时会转换为本地时区
    const result = formatTimestamp('2026-02-24T08:30:00.000Z');
    // 只检查格式，不检查具体值（因为时区不同结果不同）
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it('should 处理无效日期', () => {
    expect(formatTimestamp('invalid')).toBe('无效日期');
    expect(formatTimestamp('')).toBe('无效日期');
  });
});

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should 显示"刚刚"（小于 60 秒）', () => {
    // 用 vi.spyOn 固定当前时间来测试相对时间
    const now = new Date('2026-02-24T10:00:30.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-02-24T10:00:00.000Z')).toBe('刚刚');
  });

  it('should 显示分钟', () => {
    const now = new Date('2026-02-24T10:05:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-02-24T10:00:00.000Z')).toBe('5分钟前');
  });

  it('should 显示小时', () => {
    const now = new Date('2026-02-24T13:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-02-24T10:00:00.000Z')).toBe('3小时前');
  });

  it('should 显示"昨天"', () => {
    const now = new Date('2026-02-25T10:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-02-24T10:00:00.000Z')).toBe('昨天');
  });

  it('should 显示天数', () => {
    const now = new Date('2026-02-28T10:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime('2026-02-24T10:00:00.000Z')).toBe('4天前');
  });

  it('should 处理无效日期', () => {
    expect(formatRelativeTime('invalid')).toBe('无效日期');
  });

  it('should 处理未来时间（显示完整日期）', () => {
    const now = new Date('2026-02-24T10:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const result = formatRelativeTime('2026-02-25T10:00:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
});
