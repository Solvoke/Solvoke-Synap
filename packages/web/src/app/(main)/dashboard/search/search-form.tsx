/**
 * 搜索表单组件
 *
 * Client Component — 处理搜索输入并通过 URL 参数提交搜索。
 * 提交表单时修改 URL 的 ?q= 参数，触发 Server Component 重新渲染搜索结果。
 */
"use client";

import { type FormEvent, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFormProps {
  initialKeyword: string;
}

export function SearchForm({ initialKeyword }: SearchFormProps) {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const [keyword, setKeyword] = useState(initialKeyword);
  const router = useRouter();
  const pathname = usePathname();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      router.push(`${pathname}?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(pathname);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={t("placeholder")}
          className="pl-9"
        />
      </div>
      <Button type="submit">{tCommon("search")}</Button>
    </form>
  );
}
