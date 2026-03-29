/**
 * 对话未找到页面
 *
 * 当 getConversationById 返回 null 时，
 * 调用 notFound() 会渲染这个页面。
 */

import Link from "next/link";

import { ArrowLeft, MessageSquareOff } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export default async function ConversationNotFound() {
  const t = await getTranslations("common");
  const tConv = await getTranslations("conversation");

  return (
    <div className="space-y-6">
      <Link href="/dashboard/conversations">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="size-4" />
          {t("backToList")}
        </Button>
      </Link>

      <Empty className="min-h-[400px] border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareOff />
          </EmptyMedia>
          <EmptyTitle>{tConv("notFoundTitle")}</EmptyTitle>
          <EmptyDescription>{tConv("notFoundDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
