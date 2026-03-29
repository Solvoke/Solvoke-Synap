/**
 * 数据库种子脚本
 *
 * 生成多平台示例对话数据，用于：
 * 1. Demo 体验站展示
 * 2. 本地开发调试
 * 3. 新用户快速了解功能
 *
 * 运行方式：npm run seed
 */

// 加载 .env 文件（tsx 不会自动加载，需要手动引入）
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

// --- 配置 ---
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[Seed] DATABASE_URL is not set. Please check your .env file.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// --- 工具函数 ---

/** 生成 ISO 8601 时间字符串，在指定天数前的随机时刻 */
function randomDate(daysAgo: number): string {
  const now = Date.now();
  const offset = Math.random() * daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

/** 在两个时间之间生成递增的时间序列 */
function timeSequence(start: string, count: number): string[] {
  const startMs = new Date(start).getTime();
  const times: string[] = [];
  for (let i = 0; i < count; i++) {
    // 每条消息间隔 10~120 秒
    const gap = (10 + Math.random() * 110) * 1000;
    times.push(new Date(startMs + i * gap).toISOString());
  }
  return times;
}

// --- 示例对话数据 ---

interface SeedConversation {
  platform: string;
  title: string;
  model?: string;
  externalId?: string;
  workspace?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  daysAgo: number;
}

const SEED_CONVERSATIONS: SeedConversation[] = [
  // ---- ChatGPT ----
  {
    platform: "chatgpt",
    title: "React useEffect cleanup explained",
    model: "gpt-4o",
    externalId: "chatgpt-demo-001",
    daysAgo: 2,
    messages: [
      {
        role: "user",
        content: "Can you explain when and why useEffect cleanup functions run? I keep getting stale state issues.",
      },
      {
        role: "assistant",
        content: `The cleanup function in \`useEffect\` runs in two scenarios:

1. **Before the effect re-runs** — when dependencies change, React runs the cleanup from the previous render before executing the new effect.
2. **When the component unmounts** — React runs the cleanup as part of teardown.

Here's a common pattern that causes stale state:

\`\`\`tsx
useEffect(() => {
  const controller = new AbortController();

  fetch('/api/data', { signal: controller.signal })
    .then(res => res.json())
    .then(data => setData(data));

  // Cleanup: cancel the fetch if the component unmounts
  // or if the effect re-runs before the fetch completes
  return () => controller.abort();
}, [id]);
\`\`\`

Without the cleanup, if \`id\` changes quickly, you might set state from an outdated request — that's the "race condition" people often hit.`,
      },
      {
        role: "user",
        content: "What about with async functions? Can I make the callback async?",
      },
      {
        role: "assistant",
        content: `No — the \`useEffect\` callback itself **cannot** be async, because React expects it to return either nothing or a cleanup function (not a Promise).

The standard pattern is to define an async function inside and call it immediately:

\`\`\`tsx
useEffect(() => {
  let cancelled = false;

  async function loadData() {
    const res = await fetch(\`/api/items/\${id}\`);
    const json = await res.json();
    if (!cancelled) {
      setItems(json);
    }
  }

  loadData();

  return () => { cancelled = true; };
}, [id]);
\`\`\`

The \`cancelled\` flag ensures you don't update state after unmount or after a newer effect has started.`,
      },
    ],
  },

  // ---- Claude ----
  {
    platform: "claude",
    title: "Prisma v7 migration guide",
    model: "claude-sonnet-4-20250514",
    externalId: "claude-demo-001",
    daysAgo: 5,
    messages: [
      {
        role: "user",
        content: "I'm upgrading from Prisma v5 to v7. What are the major breaking changes I need to handle?",
      },
      {
        role: "assistant",
        content: `Here are the key breaking changes in Prisma v7:

### 1. Driver Adapters are now required
Prisma v7 removed the built-in database drivers. You must install and configure a driver adapter:

\`\`\`bash
npm install @prisma/adapter-pg pg
\`\`\`

\`\`\`typescript
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
\`\`\`

### 2. Configuration file (prisma.config.ts)
The \`datasource\` block in \`schema.prisma\` no longer contains the URL directly. Instead, use \`prisma.config.ts\`:

\`\`\`typescript
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL },
});
\`\`\`

### 3. ESM-first
Generated client is ESM by default. If you need CommonJS, add \`output: { moduleFormat: "commonjs" }\` to the generator block.

### 4. Removed deprecated methods
- \`.count()\` query syntax changed
- \`connectOrCreate\` nesting depth limited
- Raw query APIs consolidated`,
      },
    ],
  },

  // ---- Cursor ----
  {
    platform: "cursor",
    title: "Fix: TypeScript strict null checks breaking build",
    model: "claude-sonnet-4-20250514",
    externalId: "cursor-demo-001",
    workspace: "my-saas-app",
    daysAgo: 1,
    messages: [
      {
        role: "user",
        content:
          "After enabling strict: true in tsconfig.json, I'm getting 47 errors about possibly null values. Help me fix src/lib/auth.ts first.",
      },
      {
        role: "assistant",
        content: `Looking at \`src/lib/auth.ts\`, the main issues are unchecked \`.find()\` returns and unguarded \`session.user\` access. Here's the fix:

\`\`\`typescript
// Before (unsafe)
const user = users.find(u => u.id === id);
return user.name; // Error: Object is possibly 'undefined'

// After (strict-safe)
const user = users.find(u => u.id === id);
if (!user) {
  throw new Error(\`User not found: \${id}\`);
}
return user.name; // Now TypeScript knows user is defined
\`\`\`

For the session pattern, use optional chaining with a type guard:

\`\`\`typescript
export function getAuthUser(session: Session | null): AuthUser {
  if (!session?.user?.email) {
    throw new AuthError('Not authenticated');
  }
  // TypeScript now narrows session.user to non-null
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? 'Anonymous',
  };
}
\`\`\`

I've applied these patterns to all 12 occurrences in the file. The remaining 35 errors are in other files — want me to fix them next?`,
      },
      {
        role: "user",
        content: "Yes, go ahead and fix all remaining files.",
      },
      {
        role: "assistant",
        content: `Done. Here's a summary of the fixes across all files:

| File | Errors Fixed | Pattern Used |
|------|-------------|-------------|
| \`src/lib/auth.ts\` | 12 | Null guards + optional chaining |
| \`src/lib/db.ts\` | 8 | Non-null assertion for known-safe Prisma returns |
| \`src/components/UserMenu.tsx\` | 6 | Optional chaining + fallback values |
| \`src/api/routes.ts\` | 9 | Early return guards |
| \`src/utils/format.ts\` | 7 | Parameter type narrowing |
| \`src/middleware.ts\` | 5 | Type predicates |

**Total: 47 errors resolved, 0 remaining.**

Key takeaway: most strict-null errors fall into 3 categories:
1. **Array.find()** → add an existence check
2. **Optional object properties** → use \`?.\` or \`??\`
3. **Function parameters** → add explicit \`| null\` or \`| undefined\` to types`,
      },
    ],
  },

  // ---- GitHub Copilot ----
  {
    platform: "copilot",
    title: "Implement rate limiter middleware",
    model: "gpt-4o",
    externalId: "copilot-demo-001",
    workspace: "api-server",
    daysAgo: 3,
    messages: [
      {
        role: "user",
        content:
          "Write a token bucket rate limiter middleware for Express.js. Should support per-IP limits and configurable burst.",
      },
      {
        role: "assistant",
        content: `Here's a token bucket rate limiter:

\`\`\`typescript
import { Request, Response, NextFunction } from 'express';

interface BucketConfig {
  maxTokens: number;    // Maximum burst size
  refillRate: number;   // Tokens added per second
  refillInterval: number; // Refill check interval (ms)
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const DEFAULT_CONFIG: BucketConfig = {
  maxTokens: 60,
  refillRate: 10,
  refillInterval: 1000,
};

export function rateLimiter(config: Partial<BucketConfig> = {}) {
  const { maxTokens, refillRate, refillInterval } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();

    let bucket = buckets.get(ip);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      buckets.set(ip, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / refillInterval) * refillRate;
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens > 0) {
      bucket.tokens--;
      res.setHeader('X-RateLimit-Remaining', bucket.tokens);
      next();
    } else {
      res.status(429).json({ error: 'Too many requests' });
    }
  };
}
\`\`\`

Usage:
\`\`\`typescript
app.use('/api', rateLimiter({ maxTokens: 100, refillRate: 20 }));
\`\`\``,
      },
    ],
  },

  // ---- DeepSeek ----
  {
    platform: "deepseek",
    title: "Algorithm: LRU Cache implementation",
    model: "deepseek-v3",
    externalId: "deepseek-demo-001",
    daysAgo: 7,
    messages: [
      {
        role: "user",
        content: "Implement an LRU cache in TypeScript with O(1) get and put. Use a doubly linked list + Map.",
      },
      {
        role: "assistant",
        content: `\`\`\`typescript
class LRUNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public prev: LRUNode<K, V> | null = null,
    public next: LRUNode<K, V> | null = null,
  ) {}
}

export class LRUCache<K, V> {
  private map = new Map<K, LRUNode<K, V>>();
  private head: LRUNode<K, V>; // dummy head
  private tail: LRUNode<K, V>; // dummy tail

  constructor(private capacity: number) {
    this.head = new LRUNode<K, V>(null as K, null as V);
    this.tail = new LRUNode<K, V>(null as K, null as V);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) return undefined;
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      this.moveToHead(existing);
    } else {
      const node = new LRUNode(key, value);
      this.map.set(key, node);
      this.addToHead(node);
      if (this.map.size > this.capacity) {
        const lru = this.removeTail();
        this.map.delete(lru.key);
      }
    }
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private removeNode(node: LRUNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }

  private moveToHead(node: LRUNode<K, V>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private removeTail(): LRUNode<K, V> {
    const node = this.tail.prev!;
    this.removeNode(node);
    return node;
  }
}
\`\`\`

Time complexity: \`get\` and \`put\` are both O(1) — the Map provides O(1) lookup, and the doubly linked list provides O(1) insertion/removal.`,
      },
    ],
  },

  // ---- Claude Code ----
  {
    platform: "claude-code",
    title: "Refactor: Extract API client from monolithic service",
    model: "claude-sonnet-4-20250514",
    externalId: "claude-code-demo-001",
    workspace: "synap-web",
    daysAgo: 4,
    messages: [
      {
        role: "user",
        content:
          "The src/services/api.ts file is 800 lines. Split it into domain-specific modules under src/services/api/.",
      },
      {
        role: "assistant",
        content: `I'll refactor the monolithic API service into focused modules. Here's the plan:

\`\`\`
src/services/api.ts (800 lines)
  -> src/services/api/
       ├── client.ts          # Base HTTP client (axios instance, interceptors)
       ├── conversations.ts   # Conversation CRUD
       ├── messages.ts        # Message operations
       ├── search.ts          # Search API
       ├── sync.ts            # Sync endpoints
       └── index.ts           # Re-exports
\`\`\`

Starting with the base client:

\`\`\`typescript
// src/services/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap data, normalize errors
apiClient.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const message = error.response?.data?.error ?? error.message;
    return Promise.reject(new Error(message));
  },
);
\`\`\`

Each domain module imports \`apiClient\` and exports typed functions. All existing import paths will be updated with barrel re-exports from \`index.ts\`.

I've created all 6 files and updated 23 import statements across the codebase. The original \`api.ts\` has been deleted.`,
      },
    ],
  },

  // ---- Gemini ----
  {
    platform: "gemini",
    title: "CSS Grid vs Flexbox: when to use which",
    model: "gemini-2.5-pro",
    externalId: "gemini-demo-001",
    daysAgo: 10,
    messages: [
      {
        role: "user",
        content: "I always use Flexbox for everything. When should I actually use CSS Grid instead?",
      },
      {
        role: "assistant",
        content: `Good rule of thumb:

**Flexbox** = one-dimensional layout (row OR column)
**Grid** = two-dimensional layout (rows AND columns)

### Use Flexbox when:
- Laying out items in a single row or column
- You need items to shrink/grow dynamically
- Navigation bars, button groups, card footers

\`\`\`css
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`

### Use Grid when:
- You need precise control over rows AND columns simultaneously
- Dashboard layouts, magazine-style layouts, form grids
- You want items to snap to a defined grid structure

\`\`\`css
.dashboard {
  display: grid;
  grid-template-columns: 260px 1fr 300px; /* sidebar, main, aside */
  grid-template-rows: auto 1fr auto;       /* header, content, footer */
  min-height: 100vh;
}
\`\`\`

### The overlap zone
For card grids (like a product listing), both work — but Grid gives you more control:

\`\`\`css
/* Flexbox approach — wraps, but uneven last row */
.cards { display: flex; flex-wrap: wrap; gap: 16px; }
.card  { flex: 1 1 300px; }

/* Grid approach — clean aligned columns */
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
\`\`\`

The Grid version keeps columns aligned even when the last row has fewer items.`,
      },
    ],
  },

  // ---- Another ChatGPT conversation ----
  {
    platform: "chatgpt",
    title: "Docker multi-stage build optimization",
    model: "gpt-4o",
    externalId: "chatgpt-demo-002",
    daysAgo: 6,
    messages: [
      {
        role: "user",
        content: "My Node.js Docker image is 1.2GB. How do I reduce it with multi-stage builds?",
      },
      {
        role: "assistant",
        content: `Here's a typical optimization that takes a Node.js image from ~1.2GB to ~200MB:

\`\`\`dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

Key optimizations:
1. **Alpine base** — \`node:20-alpine\` is ~180MB vs \`node:20\` at ~1GB
2. **Multi-stage** — build tools and source code don't end up in the final image
3. **\`npm ci --omit=dev\`** — skip devDependencies in production
4. **Layer ordering** — \`package.json\` before source code for better cache hits`,
      },
    ],
  },
];

// --- 种子插入逻辑 ---

async function seed() {
  console.log("[Seed] Starting seed...");

  // 清理现有种子数据（通过 externalId 前缀识别）
  const demoIds = SEED_CONVERSATIONS.map((c) => c.externalId).filter(Boolean) as string[];
  const existing = await prisma.conversation.findMany({
    where: {
      externalId: { in: demoIds },
    },
    select: { id: true },
  });

  if (existing.length > 0) {
    console.log(`[Seed] Removing ${existing.length} existing demo conversations...`);
    await prisma.conversation.deleteMany({
      where: {
        id: { in: existing.map((c) => c.id) },
      },
    });
  }

  // 插入种子数据
  for (const conv of SEED_CONVERSATIONS) {
    const conversationId = nanoid();
    const createdAt = randomDate(conv.daysAgo);
    const timestamps = timeSequence(createdAt, conv.messages.length);

    await prisma.conversation.create({
      data: {
        id: conversationId,
        platform: conv.platform,
        title: conv.title,
        tags: [],
        externalId: conv.externalId ?? null,
        model: conv.model ?? null,
        workspace: conv.workspace ?? null,
        messageCount: conv.messages.length,
        createdAt: new Date(createdAt),
        updatedAt: new Date(timestamps[timestamps.length - 1] ?? createdAt),
        messages: {
          create: conv.messages.map((msg, i) => ({
            id: nanoid(),
            role: msg.role,
            content: msg.content,
            timestamp: timestamps[i] ?? createdAt,
            model: msg.role === "assistant" ? (conv.model ?? null) : null,
          })),
        },
      },
    });

    console.log(`[Seed] Created: [${conv.platform}] ${conv.title}`);
  }

  console.log(`[Seed] Done. ${SEED_CONVERSATIONS.length} conversations created.`);
}

seed()
  .catch((e) => {
    console.error("[Seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
