# Copilot Code Review Instructions

## Project Context

Solvoke Synap is a cross-platform AI conversation management tool built as an npm workspaces monorepo:
- `packages/core` — Shared TypeScript library (@synap/core)
- `packages/web` — Next.js 16 Web Dashboard + API Server

## Review Focus Areas

### Security (High Priority)
- No hardcoded secrets, passwords, API keys, or tokens
- SQL injection prevention (all DB queries through Prisma ORM)
- Input validation at API boundaries (zod schemas from @synap/core)
- No sensitive data in logs or error messages
- CORS and authentication headers properly configured

### TypeScript Strictness
- `strict: true` is enforced — no `any` types unless explicitly justified
- Prefer `unknown` over `any` for external data
- All async functions use async/await, not .then() chains
- Use Result<T, E> pattern for expected business errors

### Architecture Rules
- Server Components by default, `'use client'` only when necessary
- No emoji in UI text, constants, or log output
- All user-facing strings must use next-intl (i18n), no hardcoded text in JSX
- No hardcoded URLs, ports, timeouts, or thresholds — use constants or env vars
- Import order: node builtins → third-party → @synap/core → @/ aliases → relative

### Code Quality
- Functions should be pure when possible
- Prefer functional style over classes
- File names: kebab-case for modules, PascalCase for React components
- No unnecessary abstractions for one-time operations
- Log messages in English with `[ModuleName]` prefix

### What NOT to Flag
- Do not suggest adding JSDoc/TSDoc to internal functions
- Do not suggest adding error handling for impossible states
- Do not flag Tailwind CSS class ordering (handled by Biome)
- Do not suggest renaming `synap-` prefixed identifiers to `solvoke-synap-`
