# Solvoke Synap Core — GitHub Copilot 指令

> 本仓库是 Solvoke Synap 项目群组的**共享核心库**，包含所有子项目共用的类型定义、数据模型、Schema 验证和工具函数。
> 以 npm package 形式发布，被 synap-web、synap-extension、synap-vscode 引用。

## 项目定位

这是一个**纯 TypeScript 库**，不包含任何 UI、服务端逻辑或平台特定代码。它的职责是：
1. 定义统一的数据模型（Conversation, Message, Platform 等）
2. 提供 zod schema 用于数据验证
3. 提供通用工具函数（ID 生成、日期格式化、数据转换等）

## 技术栈

- **语言:** TypeScript（严格模式 `strict: true`）
- **构建:** tsup（打包为 ESM + CJS 双格式）
- **验证库:** zod（schema 定义和运行时验证）
- **ID 生成:** nanoid
- **测试:** vitest
- **包管理:** npm（发布为 `@synap/core`）

## 目录结构

```
synap-core/
├── src/
│   ├── models/           # 数据模型类型定义
│   ├── models/           # 数据模型类型定义 + zod schema（合并在同一文件中）
│   │   ├── conversation.ts
│   │   ├── conversation-meta.ts
│   │   ├── code-block.ts
│   │   ├── message.ts
│   │   ├── platform.ts
│   │   ├── sync.ts
│   │   └── index.ts
│   ├── utils/            # 通用工具函数
│   │   ├── id.ts         # nanoid 封装
│   │   ├── date.ts       # ISO 8601 工具
│   │   ├── content.ts    # Markdown/代码块解析
│   │   └── index.ts
│   └── index.ts          # 统一导出
├── tests/
├── tsconfig.json
├── tsup.config.ts
└── package.json
```

## 编码规范

### 导出规则
- 所有公共 API 必须从 `src/index.ts` 统一导出
- 使用 `export type` 导出纯类型（确保 tree-shaking）
- 不导出内部实现细节

### 类型定义规范
- 优先使用 `type` 而非 `interface`（除非需要 declaration merging）
- 所有类型都需要 JSDoc 注释，说明用途和字段含义
- 可选字段使用 `?` 而非 `| undefined`
- 日期字段统一使用 ISO 8601 字符串格式，不使用 Date 对象

### Schema 规范
- 每个数据模型的类型和 zod schema 定义在同一文件中（`models/` 目录下）
- Schema 导出命名：`xxxSchema`（如 `conversationSchema`）
- 从 schema 推导类型：`type Xxx = z.infer<typeof xxxSchema>`

### 工具函数规范
- 必须是纯函数（无副作用）
- 每个函数都需要单元测试
- 参数和返回值都需要明确的类型注解

### 示例代码风格

```typescript
import { z } from 'zod';
import { nanoid } from 'nanoid';

/** 对话来源平台 */
export const platformSchema = z.enum([
  'chatgpt', 'claude', 'claude-code', 'deepseek', 'gemini', 'copilot', 'cursor'
]);
export type Platform = z.infer<typeof platformSchema>;

/** 生成唯一 ID（基于 nanoid，21 位） */
export function generateId(): string {
  return nanoid();
}
```

## 版本管理
- 遵循 Semantic Versioning (semver)
- 破坏性变更（类型字段删除/重命名）必须升 major 版本
- 新增字段/类型升 minor 版本
- Bug 修复升 patch 版本

## Result 模式规范

synap-core 需导出统一的 Result 类型，供所有子项目使用：

```typescript
/** 操作结果类型 — 用于替代 try-catch 的业务错误处理 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** 成功结果的工厂函数 */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/** 失败结果的工厂函数 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

使用场景：
- 数据解析（可能格式不匹配）→ 返回 `Result<Conversation>`
- Schema 校验 → 返回 `Result<T, ZodError>`
- 不可恢复的系统错误（如内存不足）仍使用 throw

## 错误码规范

synap-core 导出统一错误码，各子项目共享：

```typescript
/** 错误码枚举 */
export const ErrorCode = {
  /** 数据验证失败 */
  ValidationFailed: 'VALIDATION_FAILED',
  /** 数据解析失败（平台响应格式变化） */
  ParseFailed: 'PARSE_FAILED',
  /** 网络请求失败 */
  NetworkError: 'NETWORK_ERROR',
  /** 存储操作失败 */
  StorageError: 'STORAGE_ERROR',
  /** 未知错误 */
  Unknown: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

## 测试规范

- 测试文件放在 `tests/` 目录，与 `src/` 平级
- 文件命名：`xxx.test.ts`，与被测文件同名
- 每个工具函数和 schema 都需要测试
- 测试用例要覆盖：正常输入、边界值、异常输入
- 示例：

```typescript
import { describe, it, expect } from 'vitest';
import { conversationSchema } from '../src/models/conversation';

describe('conversationSchema', () => {
  it('should 验证合法的对话数据', () => {
    const result = conversationSchema.safeParse(validConversation);
    expect(result.success).toBe(true);
  });

  it('should 拒绝缺少 platform 的数据', () => {
    const result = conversationSchema.safeParse({ ...validConversation, platform: undefined });
    expect(result.success).toBe(false);
  });
});
```
