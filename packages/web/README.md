# Solvoke Synap Web

> AI conversation management dashboard -- search, browse, and organize your chats from ChatGPT, Claude, Cursor, and more.

**Solvoke Synap** is a local-first, cross-platform tool that collects AI conversations from IDEs and browsers, stores them in your own database, and provides a unified web dashboard for search and management.

`synap-web` is the **Web Dashboard + API Server** component:

- Browse and search all conversations with full-text search (PostgreSQL FTS)
- Filter by platform, date range, and AI model
- View conversation details with syntax-highlighted code blocks
- Export conversations as Markdown
- Manage API keys for plugin authentication
- Receive data from Chrome Extension and VSCode Extension via sync API
- Dark/light theme with multiple color presets
- i18n support (English + Chinese)

## Quick Start (Docker)

The fastest way to run Solvoke Synap Web:

```bash
git clone https://github.com/user/synap-web.git
cd synap-web

# Also clone synap-core (shared dependency)
git clone https://github.com/user/synap-core.git ../synap-core

# Start with Docker Compose (includes PostgreSQL)
docker compose up -d
```

Dashboard will be available at **http://localhost:3000**.

The first startup will automatically run database migrations.

### Load sample data

```bash
npm run seed
```

This creates 8 demo conversations across 7 platforms.

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

### Steps

1. **Clone both repositories**

   ```bash
   git clone https://github.com/user/synap-core.git
   git clone https://github.com/user/synap-web.git
   ```

2. **Build synap-core**

   ```bash
   cd synap-core
   npm install
   npm run build
   cd ..
   ```

3. **Install synap-web dependencies**

   ```bash
   cd synap-web
   npm install --install-links
   ```

   > `--install-links` copies `@synap/core` from `../synap-core` into `node_modules` as a real package, avoiding symlink issues with Turbopack.

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string
   ```

5. **Run database migrations**

   ```bash
   npx prisma migrate deploy
   ```

6. **Start development server**

   ```bash
   npm run dev
   ```

   Open **http://localhost:3000**.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 17 + Prisma v7
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand
- **i18n**: next-intl (en + zh-CN)
- **Search**: PostgreSQL full-text search (GIN index + tsvector)
- **Code Highlighting**: Shiki (CSS Variables theme)
- **Linting**: Biome

## Project Structure

```
synap-web/
  prisma/
    schema.prisma          # Database schema
    migrations/            # Migration files
    seed.ts                # Sample data generator
  src/
    app/                   # Next.js App Router pages
      (main)/              # Main layout (sidebar + content)
        dashboard/         # Dashboard with stats
        conversations/     # Conversation list + detail
        settings/          # API key management
      api/                 # API routes
        sync/              # Sync endpoint for plugins
    components/            # Shared UI components
    lib/                   # Core utilities
      db/                  # Prisma client
      env.ts               # Environment variable validation
    i18n/                  # Internationalization config
    messages/              # Translation files (en.json, zh-CN.json)
```

## API Endpoints

- **POST** `/api/sync` -- Receive conversations from plugins
- **GET** `/api/conversations` -- List conversations (paginated, with platform filter)
- **DELETE** `/api/conversations` -- Batch delete (request body: `{ ids: string[] }`)
- **GET** `/api/conversations/[id]` -- Get conversation detail with messages
- **DELETE** `/api/conversations/[id]` -- Delete a single conversation
- **GET** `/api/conversations/[id]/export` -- Export as Markdown
- **GET** `/api/search` -- Full-text search
- **GET** `/api/settings/api-keys` -- List API keys
- **POST** `/api/settings/api-keys` -- Create API key
- **DELETE** `/api/settings/api-keys/[id]` -- Delete API key
- **GET** `/api/version` -- Version info (for update checks)
- **GET** `/api/health` -- Health check

### Authentication

When API keys exist in the database, sync requests must include a Bearer token:

```
Authorization: Bearer sk-xxxxxxxxxxxx
```

When no API keys are configured, all requests are allowed (for easy initial setup).

## Scripts

- `npm run dev` -- Start development server
- `npm run build` -- Production build
- `npm run start` -- Start production server
- `npm run seed` -- Insert sample conversation data
- `npm run lint` -- Lint with Biome
- `npm run check` -- Lint + format check
- `npm run check:fix` -- Auto-fix lint + format issues

## Related Projects

- **@synap/core** -- Shared types, schemas, and utilities
- **synap-extension** -- Chrome/Edge extension for ChatGPT and Claude
- **synap-vscode** -- VSCode/Cursor extension for IDE conversations

## License

[AGPL-3.0](LICENSE)