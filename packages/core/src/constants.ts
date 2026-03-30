/**
 * Global constants
 *
 * 禁止在代码中硬编码的值都收集在这里。
 * 各子项目自己的常量放在各自的 constants.ts 中，
 * 这里只放「所有子项目共需」的常量。
 */

// ========== 版本信息 ==========

/** 当前应用版本号（与各子项目 package.json 保持一致） */
export const APP_VERSION = '0.1.0';

/**
 * 远程版本信息端点
 *
 * 所有 Synap 实例通过拉取此地址的 version.json 来检查是否有新版本。
 * 托管在 Demo 站 Caddy 上，HTTPS + CORS。
 */
export const VERSION_CHECK_URL = 'https://synapdemo.solvoke.com/version.json';

/** 版本检查间隔（毫秒） — 2 小时 */
export const VERSION_CHECK_INTERVAL_MS = 2 * 60 * 60 * 1_000;

// ========== API 相关 ==========

/** synap-web 默认服务地址 */
export const DEFAULT_SERVER_URL = 'http://localhost:3000';

/** 同步 API 端点路径 */
export const API_ENDPOINTS = {
  /** 数据同步 */
  SYNC: '/api/sync',
  /** 对话列表 */
  CONVERSATIONS: '/api/conversations',
  /** 搜索 */
  SEARCH: '/api/search',
  /** 健康检查 */
  HEALTH: '/api/health',
  /** 版本信息 */
  VERSION: '/api/version',
  /** API Key 管理 */
  API_KEYS: '/api/settings/api-keys',
} as const;

// ========== 请求头 ==========

/** 客户端标识请求头 */
export const CLIENT_HEADER = 'X-Synap-Client';

/** API Key 前缀，用于在配置中快速辨别 */
export const API_KEY_PREFIX = 'sk-';

/** API Key 长度（不含前缀） */
export const API_KEY_LENGTH = 32;

// ========== 容量与阈值 ==========

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 20;

/** 最大分页大小 */
export const MAX_PAGE_SIZE = 100;

/** 单次同步最大对话数 */
export const MAX_SYNC_CONVERSATIONS = 50;

/** 同步请求体大小限制（字节）— 4MB */
export const MAX_SYNC_BODY_SIZE = 4 * 1024 * 1024;

/** 对话标题最大长度 */
export const MAX_TITLE_LENGTH = 200;

/** 内容预览截断长度 */
export const PREVIEW_CONTENT_LENGTH = 200;

// ========== 时间相关 ==========

/** 网络请求超时（毫秒） */
export const REQUEST_TIMEOUT_MS = 10_000;

/** 健康检查超时（毫秒） — 快速探测，不宜过长 */
export const HEALTH_CHECK_TIMEOUT_MS = 5_000;

/**
 * 版本检查超时（毫秒） — 比健康检查更宽裕
 *
 * 为什么要单独设置：VSCode 扩展主机的 Node.js fetch 可能因 DNS 解析、
 * 代理配置等原因比 curl 慢很多，5 秒经常不够。
 * 版本检查是后台任务，不阻塞用户操作，所以可以给更长时间。
 */
export const VERSION_CHECK_TIMEOUT_MS = 15_000;

/** 同步重试间隔（毫秒） — 基础值，实际使用指数退避 */
export const SYNC_RETRY_BASE_MS = 1_000;

/** 最大同步重试次数 */
export const MAX_SYNC_RETRIES = 5;

/** 自动同步间隔（毫秒） — 默认 5 分钟 */
export const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1_000;

// ========== 插件配置默认值 ==========

/** 默认同步间隔（秒） */
export const DEFAULT_SYNC_INTERVAL_SEC = 300;

/** 最小同步间隔（秒） */
export const MIN_SYNC_INTERVAL_SEC = 60;

/** 默认是否自动同步 */
export const DEFAULT_AUTO_SYNC = true;

/** 默认是否开启通知 */
export const DEFAULT_NOTIFICATIONS = true;

// ========== ID 相关 ==========

/** nanoid 默认长度 */
export const DEFAULT_ID_LENGTH = 21;
