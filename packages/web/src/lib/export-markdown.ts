/**
 * 对话导出为 Markdown 格式（Agent 上下文恢复用）
 *
 * 导出的文件用于喂给 AI Agent，快速恢复对话记忆/上下文。
 * 格式优化方向：YAML frontmatter 元数据 + 清晰的角色/时间标记 + 完整消息内容。
 * 纯函数，不依赖 React 或浏览器 API。
 */

/** 文件名中不允许的字符（Windows/macOS/Linux 通用） */
// biome-ignore lint/suspicious/noControlCharactersInRegex: 需要过滤文件名中的控制字符 \x00-\x1f
const FILENAME_UNSAFE_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/** 文件名最大长度 */
const MAX_FILENAME_LENGTH = 80;

/** 导出用的对话数据结构（与 getConversationById 返回值对齐） */
export interface ExportConversation {
  title: string;
  platform: string;
  model: string | null;
  messageCount: number;
  workspace: string | null;
  externalUrl: string | null;
  createdAt: Date;
  messages: ExportMessage[];
}

interface ExportMessage {
  role: string;
  content: string;
  model?: string | null;
  timestamp: string | Date;
}

/**
 * 将对话数据格式化为 Agent 可消费的 Markdown 文本
 *
 * 格式设计原则（为 Agent 上下文恢复优化）：
 * - YAML frontmatter：结构化元数据，Agent 可机器解析
 * - ISO 8601 时间戳：统一、无歧义的时间格式
 * - 清晰的角色标记：`### User` / `### Assistant` 便于 Agent 区分对话流
 * - 用途说明：文件顶部告诉 Agent 这是什么、如何使用
 */
export function formatConversationAsMarkdown(conv: ExportConversation): string {
  const lines: string[] = [];

  const createdDate = new Date(conv.createdAt);
  const isoDate = createdDate.toISOString();

  // YAML frontmatter — Agent 可机器解析的结构化元数据
  lines.push("---");
  lines.push(`title: "${escapeYamlString(conv.title)}"`);
  lines.push(`platform: ${conv.platform}`);
  if (conv.model) lines.push(`model: ${conv.model}`);
  lines.push(`messageCount: ${conv.messageCount}`);
  lines.push(`createdAt: ${isoDate}`);
  if (conv.workspace) lines.push(`workspace: "${escapeYamlString(conv.workspace)}"`);
  if (conv.externalUrl) lines.push(`source: ${conv.externalUrl}`);
  lines.push(`exportedAt: ${new Date().toISOString()}`);
  lines.push(`exportedBy: Solvoke Synap`);
  lines.push("---");
  lines.push("");

  // 用途说明 — 告诉 Agent 如何使用这份文档
  lines.push("# Conversation Export — For Agent Context Restoration");
  lines.push("");
  lines.push("> This document is an exported AI conversation record from **Solvoke Synap**.");
  lines.push("> Use it to restore conversation context and continue the discussion.");
  lines.push("> The frontmatter above contains structured metadata for machine parsing.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // 对话信息摘要
  lines.push("## Conversation Info");
  lines.push("");
  lines.push(`- **Title**: ${conv.title}`);
  lines.push(`- **Platform**: ${conv.platform}`);
  if (conv.model) lines.push(`- **Model**: ${conv.model}`);
  lines.push(`- **Messages**: ${conv.messageCount}`);
  lines.push(`- **Date**: ${isoDate}`);
  if (conv.workspace) lines.push(`- **Workspace**: ${conv.workspace}`);
  if (conv.externalUrl) lines.push(`- **Source**: ${conv.externalUrl}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // 对话记录
  lines.push("## Conversation Messages");
  lines.push("");

  for (let i = 0; i < conv.messages.length; i++) {
    const msg = conv.messages[i];
    const roleLabel = msg.role === "user" ? "User" : msg.role === "assistant" ? "Assistant" : "System";
    const isoTimestamp = toISOTimestamp(msg.timestamp);
    const modelSuffix = msg.model ? ` | Model: ${msg.model}` : "";

    lines.push(`### [${i + 1}/${conv.messages.length}] ${roleLabel}${modelSuffix}`);
    lines.push(`> Timestamp: ${isoTimestamp}`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * 生成安全的文件名
 *
 * 格式：`{platform}_{title}_{YYYY-MM-DD}.md`
 * - 去除文件系统不安全字符
 * - 截断过长标题
 * - 空格替换为下划线
 */
export function generateExportFilename(conv: ExportConversation): string {
  const date = new Date(conv.createdAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // 清理标题：去除不安全字符、替换空白为下划线、截断
  let safeTitle = conv.title.replace(FILENAME_UNSAFE_CHARS, "").replace(/\s+/g, "_").slice(0, MAX_FILENAME_LENGTH);

  // 去除尾部的下划线或点
  safeTitle = safeTitle.replace(/[_.]+$/, "");

  // 兜底：标题为空时用 "conversation"
  if (!safeTitle) safeTitle = "conversation";

  return `${conv.platform}_${safeTitle}_${dateStr}.md`;
}

/** 时间戳转 ISO 8601 格式（Agent 友好，无歧义） */
function toISOTimestamp(timestamp: string | Date): string {
  return new Date(timestamp).toISOString();
}

/** YAML 字符串转义：双引号内的特殊字符处理 */
function escapeYamlString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
