/**
 * 全局搜索对话框（⌘J 触发）
 *
 * Client Component — 需要处理用户输入和异步 API 调用。
 * 使用 cmdk（shadcn CommandDialog）作为基础，输入关键词后
 * 通过 GET /api/search 实时搜索对话，点击结果跳转到详情页。
 *
 * 为什么用 fetch + debounce 而不是 Server Action：
 * 因为 CommandDialog 是客户端组件，需要在输入时实时搜索，
 * 适合 fetch + debounce 模式。
 */
"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2, MessageSquare, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { HighlightText } from "@/components/highlight-text";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getPlatformLabel } from "@/config/platform";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

/** 搜索结果中的对话条目类型 */
interface SearchConversation {
  id: string;
  platform: string;
  title: string;
  messageCount: number;
  model: string | null;
  createdAt: string;
  /** 匹配的消息内容片段（关键词前后截取） */
  matchedSnippet: string | null;
  /** 匹配的消息 ID（用于跳转定位） */
  matchedMessageId: string | null;
}

/** API 搜索响应 */
interface SearchResponse {
  success: boolean;
  data: {
    conversations: SearchConversation[];
    total: number;
  };
}

/** 搜索结果数量限制（快速搜索只展示前几条） */
const SEARCH_RESULT_LIMIT = 8;

/** 防抖延迟（毫秒） */
const DEBOUNCE_DELAY_MS = 300;

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchConversation[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const tTime = useTranslations("time");

  // ⌘J / Ctrl+J 快捷键切换对话框
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // 对话框关闭时重置搜索状态
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setTotal(0);
      setHasSearched(false);
    }
  }, [open]);

  // 输入变化时 debounce 调用搜索 API
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&pageSize=${SEARCH_RESULT_LIMIT}`);
        if (!res.ok) throw new Error("Search failed");
        const json: SearchResponse = await res.json();
        setResults(json.data.conversations);
        setTotal(json.data.total);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [query]);

  /** 选择搜索结果后跳转并关闭对话框，带上关键词和匹配消息 ID以便详情页定位高亮 */
  function handleSelect(conv: SearchConversation) {
    setOpen(false);
    const params = new URLSearchParams();
    params.set("q", query.trim());
    if (conv.matchedMessageId) {
      params.set("messageId", conv.matchedMessageId);
    }
    router.push(`/dashboard/conversations/${conv.id}?${params.toString()}`);
  }

  /** 跳转到完整搜索页查看全部结果 */
  function handleViewAll() {
    setOpen(false);
    router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {tCommon("search")}
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("dialogPlaceholder")} value={query} onValueChange={setQuery} />
        <CommandList>
          {/* 初始状态：未输入关键词 */}
          {!query.trim() && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground text-sm">
              <Search className="size-5 opacity-40" />
              <span>{t("dialogDescription")}</span>
            </div>
          )}

          {/* 搜索中 */}
          {query.trim() && loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>{t("searching")}</span>
            </div>
          )}

          {/* 无结果 */}
          {query.trim() && !loading && hasSearched && results.length === 0 && (
            <CommandEmpty>{t("dialogNoResults")}</CommandEmpty>
          )}

          {/* 搜索结果 */}
          {results.length > 0 && (
            <CommandGroup heading={t("dialogResultCount", { count: total })}>
              {results.map((conv) => (
                <CommandItem
                  key={conv.id}
                  value={`${conv.title}-${conv.id}`}
                  onSelect={() => handleSelect(conv)}
                  className="!py-2.5 flex items-start gap-3"
                >
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium text-sm">
                      <HighlightText text={conv.title} keyword={query.trim()} />
                    </span>
                    {conv.matchedSnippet && (
                      <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
                        <HighlightText text={conv.matchedSnippet} keyword={query.trim()} />
                      </p>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {getPlatformLabel(conv.platform)}
                      {" · "}
                      {tCommon("messages", { count: conv.messageCount })}
                      {conv.model && ` · ${conv.model}`}
                      {" · "}
                      {formatRelativeTime(conv.createdAt, tTime)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* 查看全部结果链接 */}
          {total > SEARCH_RESULT_LIMIT && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full rounded-md px-2 py-1.5 text-center text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {t("viewAllResults", { count: total })}
              </button>
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
