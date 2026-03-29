/**
 * API Key 管理组件
 *
 * Client Component — 处理 API Key 的生成、复制、删除交互。
 * 使用 server action 回退方案，直接调用 API 路由。
 *
 * 设计要点：
 * - Key 只在创建时展示一次，之后只显示前缀预览
 * - 空状态说明「无 Key 时插件可自由同步」
 * - 删除前确认，避免误删导致插件断连
 */
"use client";

import { useRef, useState } from "react";

import { API_ENDPOINTS } from "@synap/core";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** API Key 列表项类型（服务端查询返回） */
interface ApiKeyItem {
  id: string;
  name: string;
  keyPreview: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface ApiKeyManagerProps {
  initialKeys: ApiKeyItem[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const t = useTranslations("settings.apiKeys");
  const tc = useTranslations("common");

  // API Key 列表状态
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);

  // 生成对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 创建成功后展示完整 Key 的对话框
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showCreatedDialog, setShowCreatedDialog] = useState(false);

  // 删除确认对话框状态
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 创建成功对话框中 Key 文本的 input ref，用于 fallback 选中复制
  const createdKeyInputRef = useRef<HTMLInputElement>(null);

  /** 生成新 API Key */
  async function handleCreate() {
    setIsCreating(true);
    try {
      const res = await fetch(API_ENDPOINTS.API_KEYS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() || undefined }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const result = await res.json();
      const data = result.data;

      // 展示完整 Key（仅此一次）
      setCreatedKey(data.key);
      setShowCreatedDialog(true);

      // 加入列表（用 preview 替代完整 key）
      setKeys((prev) => [
        {
          id: data.id,
          name: data.name,
          keyPreview: `${(data.key as string).slice(0, 11)}${"*".repeat(8)}`,
          createdAt: new Date(data.createdAt),
          lastUsedAt: null,
        },
        ...prev,
      ]);

      // 重置创建表单
      setShowCreateDialog(false);
      setNewKeyName("");
    } catch {
      toast.error(t("createFailed"));
    } finally {
      setIsCreating(false);
    }
  }

  /** 删除 API Key */
  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.API_KEYS}/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      toast.success(t("deleted"));
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  /** 复制到剪贴板 — 兼容 HTTP 内网环境 */
  async function handleCopy(text: string) {
    // 方案 1: Clipboard API（仅在安全上下文中尝试，避免静默失败）
    // 为什么检查 isSecureContext：在 HTTP 非 localhost 下，writeText() 可能不抛异常但也不写入剪贴板
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(tc("copied"));
        return;
      } catch {
        // Clipboard API 权限被拒，继续 fallback
      }
    }

    // 方案 2: 选中页面上已有的 input 元素 + execCommand
    // 为什么用已有 input：比创建隐藏 textarea 更可靠，浏览器对可见元素的 copy 限制更少
    const input = createdKeyInputRef.current;
    if (input) {
      input.focus();
      input.select();
      try {
        const ok = document.execCommand("copy");
        if (ok) {
          toast.success(tc("copied"));
          return;
        }
      } catch {
        // execCommand 失败，文本已被选中
      }
      // 文本已被选中，提示用户手动 Cmd+C
      toast.info(tc("copySelectHint"));
      return;
    }

    // 方案 3: 隐藏 textarea fallback（无 input ref 场景）
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "0";
      textarea.style.top = "0";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        toast.success(tc("copied"));
        return;
      }
    } catch {
      // execCommand 也失败
    }

    // 方案 4: 最终 fallback — prompt 手动复制
    window.prompt(tc("copyManualHint"), text);
  }

  /** 格式化日期为 YYYY-MM-DD HH:mm */
  function formatDate(date: Date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription className="max-w-xl">{t("description")}</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>{t("generate")}</Button>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
              <p className="text-muted-foreground mt-1 text-xs">{t("emptyDescription")}</p>
            </div>
          ) : (
            /* Key 列表 */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("key")}</TableHead>
                  <TableHead>{t("created")}</TableHead>
                  <TableHead>{t("lastUsed")}</TableHead>
                  <TableHead className="w-20 text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted rounded px-2 py-1 text-xs">{apiKey.keyPreview}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(apiKey.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : t("never")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(apiKey)}
                      >
                        {tc("delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 生成 API Key 对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generate")}</DialogTitle>
            <DialogDescription>{t("generateDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="key-name">{t("nameLabel")}</Label>
            <Input
              id="key-name"
              placeholder={t("namePlaceholder")}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建成功 — 展示完整 Key（仅此一次） */}
      <Dialog
        open={showCreatedDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreatedDialog(false);
            setCreatedKey(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createdTitle")}</DialogTitle>
            <DialogDescription>{t("createdDescription")}</DialogDescription>
          </DialogHeader>
          {createdKey && (
            <div className="space-y-3">
              <Input
                ref={createdKeyInputRef}
                readOnly
                value={createdKey}
                className="font-mono text-sm"
                onFocus={(e) => e.target.select()}
              />
              <Button className="w-full" onClick={() => handleCopy(createdKey)}>
                {t("copyKey")}
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatedDialog(false);
                setCreatedKey(null);
              }}
            >
              {t("done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && t("deleteDescription", { name: deleteTarget.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? tc("deleting") : t("confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
