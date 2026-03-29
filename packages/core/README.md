# @synap/core

> Shared types, schemas, and utilities for the Solvoke Synap ecosystem.

**Solvoke Synap** is a cross-platform AI conversation management tool that unifies chat history from ChatGPT, Claude, Cursor, GitHub Copilot, and more into a single searchable dashboard.

`@synap/core` is the shared foundation used by all Solvoke Synap sub-projects (Web Dashboard, Chrome Extension, VSCode Extension). It provides:

- **Data models** — TypeScript types + Zod schemas for runtime validation
- **Utility functions** — ID generation, date formatting, content extraction
- **Shared constants** — API endpoints, timeouts, limits
- **Result pattern** — `Result<T, E>` for type-safe error handling

## Installation

```bash
npm install @synap/core
```

## Usage

```typescript
import {
  type Conversation,
  type Message,
  type Platform,
  conversationSchema,
  generateId,
  ok,
  err,
  PLATFORMS,
} from '@synap/core';

// Validate incoming data with Zod schemas
const result = conversationSchema.safeParse(rawData);
if (!result.success) {
  console.error(result.error.issues);
}

// Generate nanoid-based unique IDs
const id = generateId(); // "V1StGXR8_Z5jdHi6B-myT"

// Type-safe error handling with Result pattern
function divide(a: number, b: number): Result<number> {
  if (b === 0) return err(new Error('Division by zero'));
  return ok(a / b);
}
```

## Supported Platforms

| Platform | Key |
|---|---|
| ChatGPT | `chatgpt` |
| Claude | `claude` |
| Claude Code | `claude-code` |
| DeepSeek | `deepseek` |
| Gemini | `gemini` |
| GitHub Copilot | `copilot` |
| Cursor | `cursor` |

## Data Models

### Conversation

The core data structure representing an AI chat session:

```typescript
interface Conversation {
  id: string;            // nanoid
  platform: Platform;
  title: string;
  messages: Message[];
  metadata: ConversationMeta;
  tags: string[];
  projectId?: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;
}
```

### Message

A single message within a conversation:

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  codeBlocks?: CodeBlock[];
  timestamp: string;
  model?: string;
  tokenCount?: number;
}
```

## API Reference

### Models & Schemas

| Export | Type | Description |
|---|---|---|
| `conversationSchema` | Zod schema | Conversation validation |
| `messageSchema` | Zod schema | Message validation |
| `platformSchema` | Zod schema | Platform enum validation |
| `syncRequestSchema` | Zod schema | Sync API request validation |
| `PLATFORMS` | `string[]` | List of all supported platforms |

### Utilities

| Function | Description |
|---|---|
| `generateId(size?)` | Generate a nanoid (default 21 chars) |
| `nowISO()` | Current time as ISO 8601 string |
| `formatTimestamp(iso)` | Format timestamp for display |
| `formatRelativeTime(iso)` | Relative time (e.g., "2 hours ago") |
| `extractCodeBlocks(content)` | Parse code blocks from Markdown |
| `truncateContent(text, len)` | Truncate with ellipsis |
| `countCodeBlocks(content)` | Count code blocks in Markdown content |

### Result Pattern

```typescript
import { ok, err, type Result } from '@synap/core';

function parseConfig(raw: string): Result<Config> {
  try {
    return ok(JSON.parse(raw));
  } catch (e) {
    return err(new Error('Invalid JSON'));
  }
}

const result = parseConfig(input);
if (result.ok) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npx tsc --noEmit
```

## License

[AGPL-3.0](LICENSE)
