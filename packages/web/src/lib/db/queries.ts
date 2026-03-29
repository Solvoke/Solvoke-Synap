/**
 * 对话数据库查询函数
 *
 * 业务逻辑集中在这里，API 路由只负责解析请求和返回响应。
 * 这样方便在 Server Components 中直接调用同一套查询函数。
 */
import type { Conversation as CoreConversation } from "@synap/core";

import { prisma } from "@/lib/db/prisma";

/** 分页参数 */
interface PaginationParams {
  page?: number;
  pageSize?: number;
  platform?: string;
}

/** 对话列表项（不包含完整 messages） */
export interface ConversationListItem {
  id: string;
  platform: string;
  title: string;
  tags: string[];
  projectId: string | null;
  messageCount: number;
  model: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 查询对话列表（分页） */
export async function getConversations(params: PaginationParams = {}) {
  const { page = 1, pageSize = 20, platform } = params;
  const skip = (page - 1) * pageSize;

  const where = platform ? { platform } : {};

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      // 不加载 messages，列表页不需要
      select: {
        id: true,
        platform: true,
        title: true,
        tags: true,
        projectId: true,
        messageCount: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return {
    conversations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/** 查询单个对话详情（包含所有 messages） */
export async function getConversationById(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!conversation) return null;

  return {
    ...conversation,
    messages: conversation.messages.map((m) => ({
      ...m,
      codeBlocks: m.codeBlocks ? JSON.parse(m.codeBlocks) : undefined,
    })),
  };
}

/** 通过 platform + externalId 查询对话详情（包含所有 messages） */
export async function getConversationByExternalId(platform: string, externalId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      platform_externalId: { platform, externalId },
    },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!conversation) return null;

  return {
    ...conversation,
    messages: conversation.messages.map((m) => ({
      ...m,
      codeBlocks: m.codeBlocks ? JSON.parse(m.codeBlocks) : undefined,
    })),
  };
}

/**
 * 搜索对话 — PostgreSQL 全文搜索（FTS）
 *
 * 使用 to_tsvector('simple', ...) + plainto_tsquery('simple', ...) 进行全文搜索。
 * 'simple' 分词器按空白拆分 + 小写化，中英文通用，无需额外安装插件。
 *
 * 搜索范围：对话标题 + 消息内容
 * 排序：按 updatedAt 倒序
 * 高亮：由数据库 ts_headline() 生成匹配片段
 *
 * 为什么用 $queryRaw 而非 Prisma ORM：
 * Prisma 不原生支持 PostgreSQL FTS 语法（to_tsvector/tsquery/ts_headline），
 * 必须用原生 SQL。本项目已有 $queryRaw 先例（getDashboardStats）。
 */
export async function searchConversations(keyword: string, params: PaginationParams = {}) {
  const { page = 1, pageSize = 20, platform } = params;
  const offset = (page - 1) * pageSize;

  // 构建 FTS 查询词：使用 plainto_tsquery 自动处理空格分隔的多词
  // plainto_tsquery('simple', 'hello world') => 'hello' & 'world'
  const tsQuery = keyword;

  // 平台过滤条件（动态拼接 SQL 比较安全的方式是用条件参数）
  // Prisma tagged template 会自动参数化防止注入
  const platformFilter = platform || "";

  // 1. 查询匹配的对话（标题 FTS 或消息内容 FTS）
  const conversations = await prisma.$queryRaw<
    {
      id: string;
      platform: string;
      title: string;
      tags: string[];
      projectId: string | null;
      messageCount: number;
      model: string | null;
      createdAt: Date;
      updatedAt: Date;
      matchedMessageId: string | null;
      matchedSnippet: string | null;
    }[]
  >`
    SELECT
      c."id",
      c."platform",
      c."title",
      c."tags",
      c."projectId",
      c."messageCount",
      c."model",
      c."createdAt",
      c."updatedAt",
      matched_msg."id" AS "matchedMessageId",
      CASE
        WHEN matched_msg."id" IS NOT NULL THEN
          regexp_replace(
            ts_headline(
              'simple',
              matched_msg."content",
              plainto_tsquery('simple', ${tsQuery}),
              'MaxWords=35, MinWords=15, MaxFragments=1'
            ),
            '</?b>', '', 'g'
          )
        ELSE NULL
      END AS "matchedSnippet"
    FROM "Conversation" c
    LEFT JOIN LATERAL (
      SELECT m."id", m."content"
      FROM "Message" m
      WHERE m."conversationId" = c."id"
        AND to_tsvector('simple', m."content") @@ plainto_tsquery('simple', ${tsQuery})
      LIMIT 1
    ) matched_msg ON true
    WHERE (
      to_tsvector('simple', c."title") @@ plainto_tsquery('simple', ${tsQuery})
      OR matched_msg."id" IS NOT NULL
    )
    AND (${platformFilter} = '' OR c."platform" = ${platformFilter})
    ORDER BY c."updatedAt" DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `;

  // 2. 查询匹配的总数（用于分页）
  const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS "count"
    FROM "Conversation" c
    WHERE (
      to_tsvector('simple', c."title") @@ plainto_tsquery('simple', ${tsQuery})
      OR EXISTS (
        SELECT 1 FROM "Message" m
        WHERE m."conversationId" = c."id"
        AND to_tsvector('simple', m."content") @@ plainto_tsquery('simple', ${tsQuery})
      )
    )
    AND (${platformFilter} = '' OR c."platform" = ${platformFilter})
  `;

  const total = Number(countResult[0]?.count ?? 0);

  return {
    conversations,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    keyword,
  };
}

/**
 * 同步对话数据（插件上报入口）
 *
 * 去重逻辑：基于 platform + externalId 联合唯一约束。
 * - 如果已存在且 updatedAt 更新 → update
 * - 如果已存在且没有更新 → skip
 * - 如果不存在 → create
 */
export async function syncConversation(data: CoreConversation): Promise<"created" | "updated" | "skipped"> {
  const externalId = data.metadata.externalId;

  // 查找是否已存在
  const existing = externalId
    ? await prisma.conversation.findUnique({
        where: {
          platform_externalId: {
            platform: data.platform,
            externalId,
          },
        },
      })
    : null;

  if (existing) {
    // 对比更新时间，如果没有新数据就跳过
    if (existing.updatedAt >= new Date(data.updatedAt)) {
      return "skipped";
    }

    // 更新：先删除旧消息，再写入新消息（简单粗暴但可靠）
    // 同时更新 id 以匹配客户端最新 ID（消息已删除，无 FK 冲突）
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { conversationId: existing.id } }),
      prisma.conversation.update({
        where: { id: existing.id },
        data: {
          id: data.id,
          title: data.title,
          tags: data.tags,
          projectId: data.projectId,
          externalUrl: data.metadata.url,
          messageCount: data.messages.length,
          model: data.metadata.model,
          workspace: data.metadata.workspace,
          updatedAt: new Date(data.updatedAt),
          messages: {
            create: data.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              codeBlocks: m.codeBlocks ? JSON.stringify(m.codeBlocks) : null,
              timestamp: m.timestamp,
              model: m.model,
              tokenCount: m.tokenCount,
            })),
          },
        },
      }),
    ]);

    return "updated";
  }

  // 新建
  await prisma.conversation.create({
    data: {
      id: data.id,
      platform: data.platform,
      title: data.title,
      tags: data.tags,
      projectId: data.projectId,
      externalId,
      externalUrl: data.metadata.url,
      messageCount: data.messages.length,
      model: data.metadata.model,
      workspace: data.metadata.workspace,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      messages: {
        create: data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          codeBlocks: m.codeBlocks ? JSON.stringify(m.codeBlocks) : null,
          timestamp: m.timestamp,
          model: m.model,
          tokenCount: m.tokenCount,
        })),
      },
    },
  });

  return "created";
}

/** 删除单个对话（级联删除其所有消息） */
export async function deleteConversation(id: string): Promise<boolean> {
  // Prisma schema 中 Message 的 onDelete: Cascade 会自动级联删除消息
  const result = await prisma.conversation.deleteMany({
    where: { id },
  });
  return result.count > 0;
}

/** 批量删除对话（级联删除其所有消息） */
export async function deleteConversations(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await prisma.conversation.deleteMany({
    where: { id: { in: ids } },
  });
  return result.count;
}

/** 获取统计信息 */
export async function getStats() {
  const [total, platforms] = await Promise.all([
    prisma.conversation.count(),
    prisma.conversation.groupBy({
      by: ["platform"],
      _count: true,
    }),
  ]);

  return {
    totalConversations: total,
    platformBreakdown: platforms.map((p) => ({
      platform: p.platform,
      count: p._count,
    })),
  };
}

/** Dashboard 首页统计数据 */
export interface DashboardStats {
  totalConversations: number;
  todayNewConversations: number;
  totalMessages: number;
  platformDistribution: { platform: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
  recentConversations: {
    id: string;
    title: string;
    platform: string;
    messageCount: number;
    model: string | null;
    updatedAt: Date;
  }[];
}

/** 获取 Dashboard 首页完整统计数据 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // 今日 0 点（UTC）
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // 7 天前的 0 点
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  const [totalConversations, todayNewConversations, totalMessages, platforms, dailyTrendRaw, recentConversations] =
    await Promise.all([
      // 总对话数
      prisma.conversation.count(),

      // 今日新增对话
      prisma.conversation.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // 总消息数
      prisma.message.count(),

      // 平台分布
      prisma.conversation.groupBy({
        by: ["platform"],
        _count: true,
        orderBy: { _count: { platform: "desc" } },
      }),

      // 7 日对话趋势：按日期分组计数
      // 使用原生 SQL，因为 Prisma groupBy 不支持按日期截断分组
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM "Conversation"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,

      // 最近 8 条对话
      prisma.conversation.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          platform: true,
          messageCount: true,
          model: true,
          updatedAt: true,
        },
      }),
    ]);

  // 将 7 日趋势填充为连续日期（确保没有对话的日期也显示 0）
  const dailyTrend: { date: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const found = dailyTrendRaw.find((r) => new Date(r.date).toISOString().slice(0, 10) === dateStr);
    dailyTrend.push({
      date: dateStr,
      count: found ? Number(found.count) : 0,
    });
  }

  return {
    totalConversations,
    todayNewConversations,
    totalMessages,
    platformDistribution: platforms.map((p) => ({
      platform: p.platform,
      count: p._count,
    })),
    dailyTrend,
    recentConversations,
  };
}

// ========== API Key 管理 ==========

/** 查询所有 API Key（不返回完整密钥，只返回前 8 位用于展示） */
export async function getApiKeys() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
  });
  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    // 只展示前 8 个字符 + 遮罩（如 sk-abcd1234****）
    keyPreview: `${k.key.slice(0, 11)}${"*".repeat(8)}`,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));
}

/** 创建新 API Key，返回完整密钥（仅此一次可见） */
export async function createApiKey(name: string, key: string) {
  const created = await prisma.apiKey.create({
    data: { name, key },
  });
  return {
    id: created.id,
    name: created.name,
    key: created.key, // 完整密钥，创建时返回一次
    createdAt: created.createdAt,
  };
}

/** 删除 API Key */
export async function deleteApiKey(id: string) {
  await prisma.apiKey.delete({ where: { id } });
}

/**
 * 验证 API Key
 * - 如果数据库中无任何 Key → 返回 'no-keys'（跳过认证，向后兼容）
 * - 如果有 Key 且匹配 → 返回 'valid'，更新 lastUsedAt
 * - 如果有 Key 但不匹配 → 返回 'invalid'
 */
export async function validateApiKey(bearerToken: string | null): Promise<"no-keys" | "valid" | "invalid"> {
  // 先检查是否有任何 API Key 存在
  const keyCount = await prisma.apiKey.count();
  if (keyCount === 0) {
    return "no-keys";
  }

  // 有 Key 但请求没带 token
  if (!bearerToken) {
    return "invalid";
  }

  // 查找匹配的 Key
  const matched = await prisma.apiKey.findUnique({
    where: { key: bearerToken },
  });

  if (!matched) {
    return "invalid";
  }

  // 更新最后使用时间（异步，不阻塞响应）
  prisma.apiKey
    .update({
      where: { id: matched.id },
      data: { lastUsedAt: new Date() },
    })
    .catch((err) => {
      console.error("[ApiKey] Failed to update lastUsedAt:", err);
    });

  return "valid";
}
