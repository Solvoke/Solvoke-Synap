import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // 允许在测试文件中直接使用 describe、it、expect（不需要 import）
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'], // 纯导出文件不需要覆盖率
    },
  },
});
