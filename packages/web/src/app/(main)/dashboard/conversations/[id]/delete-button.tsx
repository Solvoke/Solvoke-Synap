/**
 * 对话删除按钮
 *
 * Client Component — 需要处理用户交互（对话框 + fetch 请求）。
 * 为什么单独拆出来：详情页主体是 Server Component，
 * 只有这个按钮需要客户端交互，拆出来最小化 JS bundle。
 */
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  conversationId: string;
  conversationTitle: string;
}

export function DeleteConversationButton({ conversationId, conversationTitle }: DeleteButtonProps) {
  const t = useTranslations("conversation");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error?.message ?? t("deleteFailed"));
        return;
      }

      toast.success(t("deleteSuccess"));
      // 删除后返回列表页
      router.push("/dashboard/conversations");
      router.refresh();
    } catch {
      toast.error(tCommon("networkError"));
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10">
          <Trash2 className="size-4" />
          {tCommon("delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("confirmDeleteDescription", { title: conversationTitle })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting ? tCommon("deleting") : t("confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
