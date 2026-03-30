/**
 * 对话列表（带选择和批量删除功能）
 *
 * Client Component — 需要处理多选交互和批量删除请求。
 * 为什么从 Server Component 拆出来：原来的列表页是纯 Server Component 不需要交互，
 * 现在加了多选+批量删除所以需要客户端状态。
 * 分页和筛选仍然通过 URL params 驱动（Server Component 负责获取数据，这里只负责渲染和交互）。
 */
"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { MessageSquare, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getPlatformLabel } from "@/config/platform";
import type { ConversationListItem } from "@/lib/db/queries";
import { formatRelativeTime } from "@/lib/utils/format-relative-time";

/** 平台 badge 颜色样式的映射表 */
const PLATFORM_BADGE_COLOR: Record<string, string> = {
  chatgpt: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  claude: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "claude-code": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  deepseek: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  gemini: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  copilot: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  cursor: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

interface ConversationListProps {
  conversations: ConversationListItem[];
  platform?: string;
}

export function ConversationList({ conversations, platform }: ConversationListProps) {
  const t = useTranslations("conversation");
  const tCommon = useTranslations("common");
  const tTime = useTranslations("time");
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 是否处于选择模式（有任意选中项即进入选择模式）
  const isSelecting = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === conversations.length) {
      // 全选 → 全不选
      setSelectedIds(new Set());
    } else {
      // 全选
      setSelectedIds(new Set(conversations.map((c) => c.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error?.message ?? t("batchDeleteFailed"));
        return;
      }

      toast.success(t("batchDeleteSuccess", { count: data.data.deletedCount }));
      setSelectedIds(new Set());
      // 刷新页面数据（Server Component 重新渲染）
      router.refresh();
    } catch {
      toast.error(tCommon("networkError"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <Empty className="min-h-[400px] border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquare />
          </EmptyMedia>
          <EmptyTitle>{t("empty")}</EmptyTitle>
          <EmptyDescription>
            {platform ? t("emptyWithPlatform", { platform: getPlatformLabel(platform) }) : t("emptyDescription")}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      {/* 批量操作工具栏 — 选中后显示 */}
      {isSelecting && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-3">
            <Checkbox checked={selectedIds.size === conversations.length} onCheckedChange={toggleSelectAll} />
            <span className="text-sm">{t("selected", { count: selectedIds.size, total: conversations.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              {t("cancelSelection")}
            </Button>
            <Button variant="destructive" size="sm" className="gap-1" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="size-4" />
              {t("deleteSelected")}
            </Button>
          </div>
        </div>
      )}

      {/* 对话卡片列表 */}
      <div className="grid gap-3">
        {conversations.map((conv) => {
          const platformInfo = PLATFORM_BADGE_COLOR[conv.platform] ?? "bg-gray-100 text-gray-800";
          const isChecked = selectedIds.has(conv.id);

          return (
            <div key={conv.id} className="group relative flex items-start gap-3">
              {/* 选择框 — 悬停或选择模式下显示 */}
              <div
                className={`flex pt-4 ${isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleSelect(conv.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* 对话卡片 */}
              <Link href={`/dashboard/conversations/${conv.id}`} className="block flex-1">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-medium text-base leading-snug">{conv.title}</CardTitle>
                      <Badge variant="outline" className={`shrink-0 ${platformInfo}`}>
                        {getPlatformLabel(conv.platform)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-muted-foreground text-sm">
                        <span>{tCommon("messages", { count: conv.messageCount })}</span>
                        {conv.model && (
                          <>
                            <span>·</span>
                            <span>{conv.model}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{formatRelativeTime(conv.createdAt, tTime)}</span>
                      </div>
                      {conv.tags.length > 0 && (
                        <div className="flex gap-1">
                          {conv.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {conv.tags.length > 3 && (
                            <Badge variant="ghost" className="text-xs">
                              +{conv.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("batchDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("batchDeleteDescription", { count: selectedIds.size })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? tCommon("deleting") : t("confirmBatchDelete", { count: selectedIds.size })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
