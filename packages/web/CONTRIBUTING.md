# Contributing to Solvoke Synap

Thank you for your interest in contributing to Solvoke Synap! This guide covers everything you need to get started.

## Development Environment

### Prerequisites

- **macOS / Linux** (Windows with WSL should also work)
- **Node.js** 20+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** 15+ (or use Docker)
- **npm** (do not use yarn or pnpm)

### Setup

This is a monorepo managed with npm workspaces:

```
Solvoke-Synap/
  packages/core/   # @synap/core (shared types, utilities)
  packages/web/    # synap-web (Next.js dashboard + API)
```

1. **Fork and clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Solvoke-Synap.git
   cd Solvoke-Synap
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   This automatically builds `@synap/core` and generates Prisma Client via the `postinstall` script.

3. **Start PostgreSQL**

   Option A -- Use Docker:
   ```bash
   docker run -d --name synap-pg \
     -e POSTGRES_USER=synap \
     -e POSTGRES_PASSWORD=synap \
     -e POSTGRES_DB=synap \
     -p 5432:5432 \
     postgres:17-alpine
   ```

   Option B -- Use an existing PostgreSQL instance.

4. **Configure environment**

   ```bash
   cp packages/web/.env.example packages/web/.env
   ```

   Edit `.env` with your database connection string:
   ```
   DATABASE_URL="postgresql://synap:synap@localhost:5432/synap"
   ```

5. **Run migrations and seed data**

   ```bash
   cd packages/web
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   cd ../..
   ```

6. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

### Rebuilding @synap/core

If you modify `packages/core`, the workspace handles linking automatically. Just rebuild:

```bash
npm run build -w packages/core
```

## Code Style

### Formatting and Linting

This project uses [Biome](https://biomejs.dev/) for linting and formatting:

```bash
# Check for issues
npm run check

# Auto-fix
npm run check:fix
```

Biome runs automatically on staged files via husky + lint-staged when you commit.

### Key Conventions

- **TypeScript strict mode** -- all code must pass `strict: true`
- **File naming**: `kebab-case.ts` for utilities, `PascalCase.tsx` for React components
- **No emoji** in UI text, constants, or log output
- **i18n required** -- all user-facing strings must use `next-intl` (no hardcoded text in JSX)
- **English default** -- write `en.json` first, then add `zh-CN.json`
- **Logs in English** -- use `[ModuleName] description` format
- **Code comments in English** -- explain "why", not "what"
- **No hardcoded values** -- URLs, timeouts, limits go in constants or env vars

### Import Order

Group imports in this order, separated by blank lines:

1. Node.js built-ins (`fs`, `path`)
2. Third-party packages (`zod`, `next`, `react`)
3. Shared packages (`@synap/core`)
4. Project absolute paths (`@/lib/...`, `@/components/...`)
5. Relative paths (`./utils`)

## Making Changes

### Branch Naming

- `feat/short-description` -- new features
- `fix/short-description` -- bug fixes
- `docs/short-description` -- documentation
- `refactor/short-description` -- code restructuring

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type: short description

Optional detailed explanation.
```

Types: `feat` / `fix` / `docs` / `refactor` / `chore` / `style` / `test`

Examples:
- `feat: add conversation export as Markdown`
- `fix: search result pagination count`
- `docs: update README installation guide`

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure `npm run check` passes
4. Test your changes locally
5. Open a PR with a description of what changed and why
6. Wait for review

### Database Changes

If your change requires a schema modification:

1. Edit `prisma/schema.prisma`
2. Create a migration: `npx prisma migrate dev --name describe_change`
3. Include the generated migration files in your PR

## Project Architecture

```
src/
  app/                    # Next.js App Router
    (main)/               # Layout with sidebar
      dashboard/          # Stats + charts
      conversations/      # List + detail views
      settings/           # API key management
    api/                  # API route handlers
  components/             # Shared React components
  lib/                    # Server utilities, DB client
  hooks/                  # Client-side React hooks
  stores/                 # Zustand state stores
  messages/               # i18n translation files
  styles/                 # Global CSS
```

### Key Patterns

- **Server Components** by default, `'use client'` only when needed
- **Server Actions** for mutations (not API routes from client)
- **Zustand** for client-side state
- **Prisma v7** with driver adapter for database access
- **Result pattern** (`ok`/`err` from `@synap/core`) for expected errors

## Branch Workflow

- **`main`** -- Protected branch, always deployable
- Create feature branches from `main` using the naming conventions above
- Submit a Pull Request to merge back into `main`
- Direct pushes to `main` are restricted; all changes go through PR
- PRs require CI checks to pass before merging

## CI/CD

Every push and PR triggers GitHub Actions CI. All steps must pass before merging:

1. **Install** -- `npm ci` with dependency cache
2. **Build** -- `npm run build` (core + web)
3. **Test** -- `npm run test` (Vitest, 61+ tests)
4. **Lint** -- `npm run lint` (Biome for web, ESLint for core)
5. **Type Check** -- `npm run typecheck`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web dev server (auto-checks deps) |
| `npm run build` | Build core + web for production |
| `npm run test` | Run all tests |
| `npm run lint` | Lint core + web |
| `npm run typecheck` | TypeScript type checking |

## Copilot Instructions & Skills

This repo includes AI-assisted development configuration:

- **`.github/copilot-instructions.md`** -- Project-wide coding conventions, naming rules, tech stack decisions
- **`.github/skills/`** -- Specialized workflow skills (vibe-coding-workflow, memory-bank, refactor, etc.)

If you use GitHub Copilot or similar AI coding tools, these files will automatically provide project-specific context and conventions.

## Questions?

Open an [issue](https://github.com/Solvoke/Solvoke-Synap/issues/new) for questions or discussion. We're happy to help!
