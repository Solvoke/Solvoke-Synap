/**
 * Result 模式 — 用于替代 try-catch 的业务错误处理
 *
 * 为什么用 Result 而不是 try-catch：
 * - TypeScript 的 catch 块中 error 是 unknown 类型，需要手动判断
 * - Result 让错误成为返回值的一部分，编译器会强制你处理两种情况
 * - 适合「可预期的失败」（如数据格式不匹配），而非系统级异常
 *
 * 使用示例：
 * ```typescript
 * function parseConversation(raw: unknown): Result<Conversation> {
 *   const parsed = conversationSchema.safeParse(raw);
 *   if (!parsed.success) {
 *     return err(new Error(parsed.error.message));
 *   }
 *   return ok(parsed.data);
 * }
 *
 * const result = parseConversation(data);
 * if (result.ok) {
 *   console.log(result.data.title); // 类型安全地访问
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */

/** 操作结果类型 — 成功则包含 data，失败则包含 error */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** 创建成功结果 */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/** 创建失败结果 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
