# Contributing to Solvoke Synap Web

Thank you for your interest in contributing to Solvoke Synap! This guide will help you get set up for development.

## Development Environment

### Prerequisites

- **macOS / Linux** (Windows with WSL should also work)
- **Node.js** 20+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- **PostgreSQL** 15+ (or use Docker)
- **npm** (do not use yarn or pnpm)

### Setup

1. **Fork and clone the repositories**

   You need both `synap-core` (shared library) and `synap-web`:

   ```bash
   git clone https://github.com/YOUR_USERNAME/synap-core.git
   git clone https://github.com/YOUR_USERNAME/synap-web.git
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

   > `--install-links` copies `@synap/core` into `node_modules` as a real package. This avoids Turbopack symlink issues during development.

4. **Start PostgreSQL**

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

5. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database connection string:
   ```
   DATABASE_URL="postgresql://synap:synap@localhost:5432/synap"
   ```

6. **Run migrations and seed data**

   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

7. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

### Rebuilding @synap/core

If you modify `synap-core`, rebuild and reinstall:

```bash
cd ../synap-core
npm run build
cd ../synap-web
npm install --install-links
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

## Questions?

Open an issue for questions or discussion. We're happy to help!
