/**
 * 统一错误码
 *
 * 所有子项目共享这套错误码，用于 Result<T, SynapError> 中的结构化错误处理。
 * 为什么用 as const 对象而非 enum：
 * - as const 在 tree-shaking 时更友好
 * - 值就是字符串（方便日志、调试），不会像数字 enum 一样丢失可读性
 */

/** 错误码定义 */
export const ErrorCode = {
  /** 数据验证失败（zod schema 不通过） */
  ValidationFailed: 'VALIDATION_FAILED',
  /** 数据解析失败（平台响应格式变化、结构不匹配） */
  ParseFailed: 'PARSE_FAILED',
  /** 网络请求失败（超时、连接被拒、HTTP 错误等） */
  NetworkError: 'NETWORK_ERROR',
  /** 存储操作失败（本地缓存读写、数据库操作出错） */
  StorageError: 'STORAGE_ERROR',
  /** 未知错误 */
  Unknown: 'UNKNOWN',
} as const;

/** 错误码类型 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Synap 项目的结构化错误 */
export class SynapError extends Error {
  constructor(
    /** 错误码 */
    public readonly code: ErrorCode,
    /** 错误描述（英文，用于日志） */
    message: string,
    /** 原始错误（可选，用于保留错误链） */
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SynapError';
  }
}
