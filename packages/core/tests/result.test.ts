/**
 * Result 类型和错误处理测试
 */
import { describe, it, expect } from 'vitest';

import { ok, err, type Result } from '../src/result.js';
import { ErrorCode, SynapError } from '../src/errors.js';

describe('Result', () => {
  it('should 创建成功结果', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe(42);
    }
  });

  it('should 创建失败结果', () => {
    const result = err(new Error('something went wrong'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('something went wrong');
    }
  });

  it('should 支持复杂的泛型类型', () => {
    type User = { name: string; age: number };
    const result: Result<User> = ok({ name: 'Alice', age: 30 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe('Alice');
    }
  });

  it('should 支持自定义错误类型', () => {
    const result: Result<string, SynapError> = err(
      new SynapError(ErrorCode.ValidationFailed, 'Invalid input'),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_FAILED');
      expect(result.error.message).toBe('Invalid input');
    }
  });
});

describe('ErrorCode', () => {
  it('should 包含所有预定义的错误码', () => {
    expect(ErrorCode.ValidationFailed).toBe('VALIDATION_FAILED');
    expect(ErrorCode.ParseFailed).toBe('PARSE_FAILED');
    expect(ErrorCode.NetworkError).toBe('NETWORK_ERROR');
    expect(ErrorCode.StorageError).toBe('STORAGE_ERROR');
    expect(ErrorCode.Unknown).toBe('UNKNOWN');
  });
});

describe('SynapError', () => {
  it('should 创建结构化错误', () => {
    const error = new SynapError(ErrorCode.ParseFailed, 'Failed to parse ChatGPT response');
    expect(error.code).toBe('PARSE_FAILED');
    expect(error.message).toBe('Failed to parse ChatGPT response');
    expect(error.name).toBe('SynapError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should 支持保留原始错误', () => {
    const originalError = new TypeError('Cannot read property x');
    const error = new SynapError(ErrorCode.Unknown, 'Unexpected error', originalError);
    expect(error.cause).toBe(originalError);
  });
});
