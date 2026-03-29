/**
 * 消息列表组件（Client Component）
 *
 * 为什么是 Client Component：
 * 需要在客户端执行两个操作：
 * 1. 从 URL 的 searchParams 读取 ?q=关键词&messageId=消息ID
 * 2. 页面渲染后自动滚动到匹配的消息位置
 *
 * 关键词高亮策略：
 * - 用户消息（纯文本）：直接用 HighlightText 组件高亮
 * - AI 消息（Markdown）：仍用 MarkdownRenderer 渲染，不在 Markdown 内容中插入高亮
 *   （避免破坏 Markdown 结构，如代码块、链接等）
 * - 目标消息卡片加黄色边框 + 脉冲动画，视觉上提示「这是你搜的那条」
 */
"use client";

import { useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { Bot, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { HighlightText } from "@/components/highlight-text";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** 消息类型（从 Server Component 传入） */
interface Message {
  id: string;
  role: string;
  content: string;
  model?: string | null;
  timestamp: string;
  tokenCount?: number | null;
}

interface MessageListProps {
  messages: Message[];
}

/** 高亮持续时间和渐隐时间（毫秒） */
const HIGHLIGHT_HOLD_MS = 3000;
const HIGHLIGHT_FADE_MS = 2000;

export function MessageList({ messages }: MessageListProps) {
  const tRole = useTranslations("role");
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const targetMessageId = searchParams.get("messageId") || "";

  // 页面渲染后：先滚动到目标消息，滚动完成后用 JS 直接设置高亮样式
  // 为什么不用 ref 而用 getElementById：
  // useSearchParams 导致 SSR/CSR 不一致（hydration mismatch），
  // 条件 ref（isTarget ? ref : undefined）在 SSR 时 isTarget=false,
  // 客户端 hydration 后才变 true，但 ref 可能在 timeout 的闭包中丢失。
  // 直接用 DOM API 查找最可靠。
  useEffect(() => {
    if (!targetMessageId) return;
    const timer = setTimeout(() => {
      const wrapper = document.getElementById(`msg-${targetMessageId}`);
      if (!wrapper) return;
      // 滚动到目标消息顶部
      wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
      // 滚动动画约 300-500ms 后再触发高亮
      setTimeout(() => {
        const card = wrapper.querySelector<HTMLElement>('[data-slot="card"]');
        if (!card) return;
        // 设置初始高亮状态：黄色 outline
        card.style.outline = "3px solid oklch(0.85 0.15 85)";
        card.style.outlineOffset = "2px";
        // 保持高亮一段时间后开始渐隐
        setTimeout(() => {
          card.style.transition = `outline-color ${HIGHLIGHT_FADE_MS}ms ease-out`;
          card.style.outlineColor = "transparent";
          // 渐隐完成后清理 inline style
          setTimeout(() => {
            card.style.outline = "";
            card.style.outlineOffset = "";
            card.style.transition = "";
          }, HIGHLIGHT_FADE_MS + 100);
        }, HIGHLIGHT_HOLD_MS);
      }, 600);
    }, 500);
    return () => clearTimeout(timer);
  }, [targetMessageId]);

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          id={`msg-${msg.id}`}
          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* 头像 */}
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
              msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {msg.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
          </div>

          {/* 消息内容 */}
          <Card className={`max-w-[80%] ${msg.role === "user" ? "bg-primary/5" : "bg-muted/50"}`}>
            <CardHeader className="px-3 py-2">
              <div className="flex items-center gap-2">
                <CardTitle className="font-medium text-xs">
                  {msg.role === "user" ? tRole("user") : tRole("assistant")}
                </CardTitle>
                {msg.model && <span className="text-muted-foreground text-xs">{msg.model}</span>}
                <span className="text-muted-foreground text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="px-3 pt-0 pb-3">
              {msg.role === "assistant" ? (
                <MarkdownRenderer content={msg.content} />
              ) : keyword ? (
                // 用户消息 + 有搜索关键词 → 高亮关键词
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  <HighlightText text={msg.content} keyword={keyword} />
                </div>
              ) : (
                // 用户消息 + 无搜索关键词 → 纯文本
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
