import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import createNextIntlPlugin from 'next-intl/plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

// next-intl 插件 — 指定 request.ts 路径，自动处理服务端翻译加载
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone 模式：构建后生成自包含的 server.js，不依赖 node_modules
  // Docker 部署必需，也能让镜像体积更小（只打包用到的依赖）
  output: 'standalone',
  // Monorepo: trace dependencies from the workspace root (2 levels up from packages/web)
  // This ensures standalone output includes workspace packages like @synap/core
  outputFileTracingRoot: join(__dirname, '../../'),
  reactCompiler: true,
  compiler: {
    // 生产环境移除 console.log/info/debug，但保留 error/warn 用于服务端日志
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },
  // @synap/core is a workspace package — Next.js needs to transpile it for Turbopack
  transpilePackages: ['@synap/core'],
};

export default withNextIntl(nextConfig);
