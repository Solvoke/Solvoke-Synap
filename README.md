# Solvoke Synap

> Cross-platform AI conversation manager. Collect, search, and organize your chats from ChatGPT, Claude, Copilot, Cursor, and more.

This is the monorepo for Solvoke Synap's open-source components:

| Package | Description |
|---------|-------------|
| [packages/core](packages/core/) | `@synap/core` -- Shared types, data models, validation schemas |
| [packages/web](packages/web/) | `synap-web` -- Next.js Web Dashboard + API Server |

## Quick Start (Docker)

```bash
git clone https://github.com/Solvoke/Solvoke-Synap.git
cd Solvoke-Synap

# One-click deploy (recommended)
./deploy.sh
```

The deploy script automatically:
- Checks Docker and Docker Compose versions
- Generates a random database password
- Detects port conflicts and picks an available port
- Starts all services and waits for health check

Dashboard: **http://localhost:3000**

### Configuration

Set environment variables before running `deploy.sh`:

```bash
SYNAP_PORT=8080 ./deploy.sh           # Custom port
SYNAP_DB_PASSWORD=mypass ./deploy.sh   # Custom database password
```

### Manual deploy

```bash
docker compose up -d
```

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Docker Compose)
- npm

### Install and run

```bash
# Install all dependencies (automatically builds core + generates Prisma Client)
npm install

# Configure database
cp packages/web/.env.example packages/web/.env
# Edit .env with your PostgreSQL connection string

# Run database migrations
cd packages/web && npx prisma migrate deploy && cd ../..

# Start dev server
npm run dev
```

The `dev` command automatically checks that `@synap/core` is built and Prisma Client is generated. If anything is missing, it rebuilds before starting.

### Custom port

```bash
PORT=4000 npm run dev
```

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web dev server (auto-checks dependencies) |
| `npm run build` | Build core + web for production |
| `npm run test` | Run all tests (core: 61 tests) |
| `npm run lint` | Lint core + web |
| `npm run typecheck` | TypeScript type checking |
| `npm run build:core` | Build @synap/core only |
| `npm run build:web` | Build synap-web only |

## Architecture

```
Browser Extensions ──┐
  (ChatGPT, Claude)  │
                     ├──> synap-web (API Server + Dashboard)
IDE Extensions ──────┘         │
  (Copilot, Cursor,            v
   Claude Code)          PostgreSQL
                              │
                     @synap/core (shared types)
```

## Tech Stack

- **Monorepo**: npm workspaces
- **Core**: TypeScript, zod, nanoid
- **Web**: Next.js 16 (App Router), Prisma v7, PostgreSQL, TailwindCSS v4, shadcn/ui, next-intl, Zustand, Biome
- **Testing**: vitest

## License

AGPL-3.0 -- See [packages/core/LICENSE](packages/core/LICENSE) and [packages/web/LICENSE](packages/web/LICENSE).
