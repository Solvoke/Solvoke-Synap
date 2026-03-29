/**
 * Pre-dev check: ensure core is built and Prisma Client is generated.
 * Runs automatically before `npm run dev` via the `predev` script.
 * Skips steps that are already done (fast no-op on subsequent runs).
 */
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const ROOT = new URL('..', import.meta.url).pathname;

function run(cmd, label) {
  console.log(`[predev] ${label}...`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Check if @synap/core dist exists
if (!existsSync(`${ROOT}/packages/core/dist/index.js`)) {
  run('npm run build:core', 'Building @synap/core');
} else {
  console.log('[predev] @synap/core dist OK');
}

// 2. Check if Prisma Client is generated
if (!existsSync(`${ROOT}/node_modules/.prisma/client/default.js`)) {
  run('cd packages/web && npx prisma generate', 'Generating Prisma Client');
} else {
  console.log('[predev] Prisma Client OK');
}

console.log('[predev] Ready');
