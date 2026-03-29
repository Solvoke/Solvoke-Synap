import { defineConfig } from 'tsup';

// tsup 是一个零配置的 TypeScript 打包工具，基于 esbuild
// 这里配置双格式输出（ESM + CJS），让它兼容所有使用方式
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // 自动生成 .d.ts 类型声明文件
  sourcemap: true,
  clean: true, // 每次构建前清除 dist 目录
  splitting: false, // 单入口不需要分包
  treeshake: true,
});
