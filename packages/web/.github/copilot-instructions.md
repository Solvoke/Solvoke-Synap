# Solvoke Synap Web — GitHub Copilot 指令

> 本仓库是 Solvoke Synap 的 **Web Dashboard + API Server**，基于 Next.js 构建。
> 它既是用户管理对话记录的 Web 界面，也是各端插件数据上报的 API 服务端。

## 项目定位

- **Web Dashboard：** 用户在浏览器中查看、搜索、管理所有 AI 对话记录
- **API Server：** 接收来自 Chrome 插件和 VSCode 插件的对话数据，存入数据库
- **MVP 阶段以 localhost 部署为主**，后续支持 SaaS 云端部署

## 技术栈

- **框架:** Next.js 16（App Router，Turbopack 开发模式）
- **语言:** TypeScript（严格模式）
- **样式:** TailwindCSS v4（CSS-based config）+ shadcn/ui 组件库
- **代码质量:** Biome（替代 ESLint + Prettier，统一 lint + format）
- **数据库:** PostgreSQL（通过 Prisma v7 ORM，Driver Adapter 模式）
- **搜索:** PostgreSQL FTS 全文搜索（GIN 索引 + tsvector/tsquery）；远期语义搜索使用 Embedding
- **状态管理:** zustand（轻量级，适合中小型应用）
- **共享类型:** `@synap/core`（从 synap-core 仓库引用）
- **其他:** React 19、React Compiler、recharts（图表）、TanStack Table（表格）、react-hook-form + zod（表单）

## 目录结构

```
synap-web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (external)/             # 外部路由组（如首页重定向）
│   │   ├── (main)/dashboard/       # 主面板路由组
│   │   │   ├── _components/sidebar/  # 侧边栏组件（AppSidebar, NavMain 等）
│   │   │   ├── conversations/      # 对话列表/详情页
│   │   │   ├── search/             # 搜索页
│   │   │   ├── settings/           # 设置页
│   │   │   ├── layout.tsx          # 面板布局（侧边栏+主区域）
│   │   │   └── page.tsx            # Dashboard 首页
│   │   ├── api/                    # API 路由
│   │   │   ├── conversations/      # 对话 CRUD
│   │   │   ├── sync/               # 插件数据同步端点
│   │   │   ├── search/             # 搜索 API
│   │   │   └── health/             # 健康检查
│   │   ├── layout.tsx              # 根布局
│   │   └── not-found.tsx           # 404 页面
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 基础组件（~50个）
│   │   ├── data-table/             # TanStack Table 数据表格组件
│   │   └── simple-icon.tsx         # 图标组件
│   ├── config/
│   │   └── app-config.ts           # 应用名称、版本等全局配置
│   ├── navigation/
│   │   └── sidebar/sidebar-items.ts  # 侧边栏导航结构定义
│   ├── stores/
│   │   └── preferences/            # UI 偏好设置 Store（主题、布局等）
│   ├── hooks/                      # 自定义 React Hooks
│   ├── lib/
│   │   ├── db/                     # 数据库相关（Prisma client, queries）
│   │   ├── services/               # 业务逻辑层
│   │   ├── preferences/            # 主题/布局偏好工具函数
│   │   ├── fonts/                  # 字体注册
│   │   ├── utils.ts                # 通用工具（cn 函数等）
│   │   └── constants.ts            # 常量定义
│   ├── scripts/                    # 构建脚本（主题预设生成等）
│   ├── server/                     # Server Actions
│   └── types/                      # 本地类型定义
├── prisma/
│   └── schema.prisma               # 数据库 schema
├── public/
├── next.config.mjs
├── biome.json                       # Biome 配置（lint + format）
└── package.json
```

## 编码规范

### Next.js 特定规则
- **默认使用 Server Components**，仅在需要交互（事件处理、useState/useEffect）时标记 `'use client'`
- API 路由使用 Route Handlers（`route.ts`），不使用旧版 `pages/api`
- 页面数据获取优先使用 Server Components 直接查询数据库，不通过 API
- 客户端数据请求使用 `fetch` + `useSWR` 或 `React Query`
- 环境变量：服务端使用 `process.env.XXX`，客户端使用 `NEXT_PUBLIC_` 前缀

### API 设计规范
- RESTful 风格，路径格式：`/api/conversations`, `/api/conversations/[id]`
- 统一响应格式：
  ```typescript
  // 成功
  { success: true, data: T }
  // 失败  
  { success: false, error: { code: string, message: string } }
  ```
- 请求体验证使用 zod schema（从 `@synap/core` 引入）
- API 路由必须包含错误处理，返回合适的 HTTP 状态码

### 组件规范
- 使用函数式组件（箭头函数或 function 声明均可）
- Props 类型直接在函数参数中定义，不需要单独定义 Props interface（除非被复用）
- UI 展示组件放在 `components/` 下，与业务逻辑（`lib/services/`）分离
- 使用 shadcn/ui 作为基础 UI 组件库，不要从零手写基础组件（Button, Dialog, Input 等）

### 数据库规范
- Prisma schema 中的模型名使用 PascalCase（如 `Conversation`）
- 字段名使用 camelCase
- 所有表必须包含 `id`, `createdAt`, `updatedAt` 字段
- 关联关系明确定义外键和级联删除规则

### 样式规范
- 使用 TailwindCSS v4 utility classes，不写自定义 CSS（除非 Tailwind 无法覆盖）
- **Tailwind v4 采用 CSS-based 配置**（在 `src/app/globals.css` 中 `@import` + `@theme`），没有 `tailwind.config.ts` 文件
- 响应式设计使用 Tailwind 断点（sm/md/lg/xl）
- 颜色使用 CSS 变量（通过 shadcn/ui 的主题系统），不硬编码颜色值
- 暗色模式通过 `dark:` 变体支持

### 主题 / UI / UX 设计规范

#### 设计系统基础
- **组件库**：shadcn/ui（基于 Radix UI + Tailwind CSS）
- **图标**：`lucide-react`（shadcn/ui 默认图标库）
- **字体**：系统默认字体栈（`font-sans`），不引入额外 Web 字体
- **圆角**：统一使用 shadcn/ui 的 `--radius` CSS 变量

#### 颜色系统
- **禁止直接写颜色值**（如 `#3b82f6`、`text-blue-500`）
- 使用 shadcn/ui 语义化 CSS 变量：
  ```
  背景：bg-background / bg-card / bg-muted
  文字：text-foreground / text-muted-foreground
  边框：border-border
  强调：bg-primary / text-primary-foreground
  危险：bg-destructive / text-destructive
  ```
- 自定义语义色（在 `globals.css` 中定义）：
  ```
  --synap-chatgpt: 平台 ChatGPT 的品牌色
  --synap-claude: 平台 Claude 的品牌色
  ...每个 Platform 一个品牌色
  ```

#### 间距系统
- 使用 Tailwind 4px 间距刻度（`p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px）
- 组件内间距：`p-3` 或 `p-4`
- 组件间间距：`gap-4` 或 `space-y-4`
- 页面级间距：`p-6`
- **禁止使用任意值**（如 `p-[13px]`），除非适配第三方样式

#### 排版规范
- 页面标题：`text-2xl font-bold`
- 卡片标题：`text-lg font-semibold`
- 正文：`text-sm`（shadcn/ui 默认）
- 辅助文本：`text-xs text-muted-foreground`
- 代码块：`font-mono text-sm`

#### 响应式断点
- 手机优先设计（base → sm → md → lg → xl）
- 侧边栏在 `md` 以下收起为汉堡菜单
- 对话列表在 `lg` 以下隐藏详情面板

#### 暗色模式
- 使用 `next-themes` 管理主题切换
- 所有颜色通过 CSS 变量自动适配，不需要写 `dark:` 前缀
- 图片/图标需要在暗色模式下可见（避免纯黑 icon）

#### 无障碍 (a11y)
- 交互元素必须有 `aria-label`（当没有可见文本时）
- 使用语义化 HTML 标签（`<nav>`, `<main>`, `<aside>`, `<article>`）
- 焦点状态使用 `focus-visible:ring-2`（shadcn/ui 已内置）
- 颜色对比度不低于 WCAG AA 标准（4.5:1）

### Loading / Error UI 规范
- 每个页面路由可配置 `loading.tsx`（骨架屏或 Spinner）
- 每个页面路由可配置 `error.tsx`（错误边界，显示重试按钮）
- 空状态使用专用插图 + 引导文案（如「还没有对话记录，快去安装 Chrome 插件吧」）
- 加载状态使用 shadcn/ui 的 `Skeleton` 组件，不用自定义 spinner
- API 请求失败时显示 shadcn/ui 的 `toast` 提示

### zustand Store 规范
- 每个功能域一个 Store 文件（如 `conversation.store.ts`、`search.store.ts`）
- Store 文件放在 `src/stores/` 目录
- Store 命名：`useXxxStore`（如 `useConversationStore`）
- 不在 Store 中做 API 调用，API 逻辑放在 `src/lib/services/`
- Store 仅管理客户端 UI 状态（筛选条件、选中项、折叠状态等）
- 避免 Store 中存放可从 URL/服务端获取的数据

### 测试规范
- 组件测试使用 `@testing-library/react` + vitest
- API 路由测试使用 vitest + 模拟 Request/Response
- E2E 测试使用 Playwright（放在 `e2e/` 目录）
- 关键用户流程必测：对话列表加载、搜索、数据同步

### 关键业务逻辑

**数据同步流程（Chrome 插件 → Solvoke Synap Web）：**
1. 插件通过 `POST /api/sync` 发送对话数据
2. 服务端用 zod schema 验证数据格式
3. 去重检查（基于 platform + externalId）
4. 存入 PostgreSQL
5. 异步触发全文索引更新

## 部署

### 开源版（Docker Compose 一键部署）
- 使用 `docker compose up -d` 启动 synap-web + PostgreSQL
- 数据持久化到 Docker Volume
- 用户可通过 `DATABASE_URL` 环境变量指向自己的 PostgreSQL 实例
- `next.config.mjs` 已配置 `output: 'standalone'`

### 开发环境
- 使用 `npm run dev` 启动 Turbopack 开发服务器
- 需要本地或内网 PostgreSQL 实例
- 数据库连接通过 `.env` 中的 `DATABASE_URL` 配置

### 后续阶段（SaaS 部署）
- 部署平台：Docker 自部署或云服务器
- 数据库：PostgreSQL（与开源版相同）
