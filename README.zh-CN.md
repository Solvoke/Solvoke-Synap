<div align="center">

[English](README.md) | **中文**

# Solvoke Synap

**跨平台 AI 对话管理工具**

采集、搜索、整理你在 ChatGPT、Claude、Copilot、Cursor、Claude Code 等平台的对话记录 -- 全部汇聚于一处。

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![CI](https://github.com/Solvoke/Solvoke-Synap/actions/workflows/ci.yml/badge.svg)](https://github.com/Solvoke/Solvoke-Synap/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)

[在线演示](https://synapdemo.solvoke.com) &middot; [反馈问题](https://github.com/Solvoke/Solvoke-Synap/issues/new?template=bug_report.yml) &middot; [功能建议](https://github.com/Solvoke/Solvoke-Synap/issues/new?template=feature_request.yml)

<img src="media/dashboard.png" alt="Solvoke Synap Dashboard" width="800" />

</div>

---

## 为什么选择 Solvoke Synap?

AI 对话散落在 ChatGPT 标签页、Claude 窗口、Copilot 侧边栏和 Cursor 编辑器中。想找回上周那段好用的代码片段或 Prompt，意味着要翻遍多个平台。

Solvoke Synap 打通了这些壁垒：

- **本地优先备份** -- 对话数据留在你自己的机器上，不被锁在云端
- **跨平台搜索** -- 在一个仪表盘中搜索所有 AI 对话
- **项目级组织** -- 用标签和分组按项目管理对话
- **插件自动同步** -- 浏览器扩展和 IDE 插件自动采集对话
- **自托管部署** -- 一条命令启动，完全掌控你的数据

## 架构

```
+-------------------+     +-------------------+
|   浏览器扩展       |     |    IDE 插件        |
| (ChatGPT, Claude) |     | (Copilot, Cursor, |
+--------+----------+     |  Claude Code)     |
         |                 +--------+----------+
         |    REST API (sync)       |
         +------------+-------------+
                      |
                      v
         +------------+-------------+
         |        synap-web         |
         |   仪表盘 + API 服务器     |
         +------------+-------------+
                      |
                      v
              +-------+-------+
              |  PostgreSQL   |
              +---------------+
                      |
              @synap/core (共享类型库)
```

## 生态系统

<div align="center">
  <img src="media/vscode-extension.png" alt="VSCode Extension" width="400" />
  <img src="media/chrome-extension.png" alt="Chrome Extension" width="400" />
  <p><em>左: VSCode/Cursor IDE 插件 &nbsp;|&nbsp; 右: Chrome 浏览器扩展 (ChatGPT)</em></p>
</div>

| 组件 | 安装方式 |
|------|----------|
| **synap-web** (仪表盘 + API) | [Docker 或 npm](#快速开始) |
| **@synap/core** (共享库) | npm |
| **浏览器扩展** (Chrome/Edge) | [GitHub Releases](https://github.com/Solvoke/Solvoke-Synap/releases) |
| **IDE 插件** (VSCode/Cursor) | [GitHub Releases](https://github.com/Solvoke/Solvoke-Synap/releases) |

> 数据层（core + web）以 AGPL-3.0 开源，方便你审计处理数据的代码。插件为闭源，目前通过 GitHub Releases 下载。

## 快速开始

### Docker（推荐）

```bash
git clone https://github.com/Solvoke/Solvoke-Synap.git
cd Solvoke-Synap
./deploy.sh
```

部署脚本会自动处理一切：
- 检查 Docker 和 Docker Compose 可用性
- 生成安全的数据库密码
- 检测端口冲突并自动选择可用端口
- 启动 PostgreSQL + synap-web 并等待健康检查

准备就绪后打开 **http://localhost:3000**。

#### 选项

```bash
SYNAP_PORT=8080 ./deploy.sh           # 自定义端口
SYNAP_DB_PASSWORD=mypass ./deploy.sh   # 自定义数据库密码
```

### 开发环境

**前置条件：** Node.js 20+、PostgreSQL 15+（或 Docker）、npm

```bash
git clone https://github.com/Solvoke/Solvoke-Synap.git
cd Solvoke-Synap

# 安装依赖（自动构建 core + 生成 Prisma Client）
npm install

# 配置数据库
cp packages/web/.env.example packages/web/.env
# 编辑 .env，填入你的 PostgreSQL 连接字符串

# 运行数据库迁移
cd packages/web && npx prisma migrate deploy && cd ../..

# 启动开发服务器
npm run dev
```

`dev` 命令会检查 `@synap/core` 是否已构建、Prisma Client 是否已生成。如有缺失会自动重新构建。

### 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Web 开发服务器（自动检查依赖）|
| `npm run build` | 构建 core + web 生产版本 |
| `npm run test` | 运行全部测试（core: 61 tests）|
| `npm run lint` | 代码检查（core + web）|
| `npm run typecheck` | TypeScript 类型检查 |

## 技术栈

| 层级 | 技术 |
|------|------|
| Monorepo | npm workspaces |
| 共享库 | TypeScript, zod, nanoid |
| Web 框架 | Next.js 16 (App Router) |
| 数据库 | Prisma v7 + PostgreSQL |
| UI | TailwindCSS v4, shadcn/ui |
| 国际化 | next-intl (en, zh-CN) |
| 状态管理 | Zustand |
| 代码质量 | Biome (lint + format) |
| 测试 | Vitest |
| CI/CD | GitHub Actions |

## 支持平台

| 平台 | 采集方式 | 状态 |
|------|----------|------|
| ChatGPT | 浏览器扩展（网络拦截）| 已支持 |
| Claude | 浏览器扩展（网络拦截）| 已支持 |
| GitHub Copilot | IDE 插件（本地文件监听）| 已支持 |
| Cursor | IDE 插件（本地文件监听）| 已支持 |
| Claude Code | IDE 插件（本地文件监听）| 开发中 |

## 路线图

即将支持的平台和功能：

- **Claude Code** -- 完整 IDE 插件支持（开发中）
- **DeepSeek** -- 浏览器扩展适配器
- **Gemini Web** -- 浏览器扩展适配器
- **OpenClaw** -- 浏览器扩展适配器
- **Google Antigravity** -- 浏览器扩展适配器
- **项目管理** -- 将对话按项目组织，附带笔记和上下文
- **AI 摘要** -- 自动生成对话摘要和关键要点

## 参与贡献

欢迎贡献!

- 代码、注释和 commit message 使用**英文**
- Commit 格式: [Conventional Commits](https://www.conventionalcommits.org/)（如 `feat: add search filter`）
- 提交 PR 前运行 `npm run lint && npm run test`

### CI/CD

每次 push 和 PR 都会触发 GitHub Actions CI：

1. **安装** -- `npm ci` + 依赖缓存
2. **构建** -- `npm run build`（core + web）
3. **测试** -- `npm run test`（Vitest）
4. **检查** -- `npm run lint`（web 用 Biome，core 用 ESLint）
5. **类型检查** -- `npm run typecheck`

所有检查通过后方可合并。

### Copilot 指令与技能

本仓库包含 `.github/copilot-instructions.md` 和 `.github/skills/`，用于 AI 辅助开发。如果你使用 GitHub Copilot 或类似工具，这些文件提供了项目专属的编码规范和工作流。

## 许可证

本项目采用 **AGPL-3.0** 许可证。详见 [LICENSE](packages/core/LICENSE)。

AGPL 许可证确保数据层的修改保持开源，在保护用户信任的同时支持自托管。

## 致谢

Web 仪表盘 UI 基于 [@arhamkhnz](https://github.com/arhamkhnz) 的 [next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard)（MIT 许可证）构建。

---

<div align="center">
  <sub>由 <a href="https://github.com/Solvoke">Solvoke</a> 构建</sub>
</div>
