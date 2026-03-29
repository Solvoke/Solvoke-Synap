/**
 * Markdown 渲染组件
 *
 * Client Component — react-markdown 需要在客户端渲染。
 * 为什么用 react-markdown：最主流的 React Markdown 渲染库，
 * 文档丰富，支持自定义组件覆盖，且和 remark/rehype 生态兼容。
 *
 * 代码高亮用 shiki（与 Next.js 生态契合），但为了避免首次加载太慢，
 * 采用懒加载方式：先渲染纯文本代码块，异步加载高亮后替换。
 *
 * 双主题适配：使用 shiki 的 CSS Variables 模式（themes + defaultColor: false），
 * 同一份 HTML 同时包含 light/dark 两套颜色值，由 CSS 变量切换，
 * 与项目的 .dark class 体系完美兼容，切换主题无需重新高亮。
 */
"use client";

import type { ComponentPropsWithoutRef } from "react";
import { memo, useEffect, useState } from "react";

import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { codeToHtml } from "shiki";

/** 代码块高亮缓存，避免同一代码块重复高亮 */
const highlightCache = new Map<string, string>();

/** 高亮渲染的代码 — 提取为独立组件以便加 biome-ignore */
function HighlightedCode({ html }: { html: string }) {
  return (
    <div
      className="[&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:!p-0 overflow-x-auto p-4 text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** 代码块组件 — 带语法高亮和复制按钮 */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const tCommon = useTranslations("common");
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cacheKey = `${language}:${code}`;
    const cached = highlightCache.get(cacheKey);
    if (cached) {
      setHtml(cached);
      return;
    }

    // 异步加载高亮，shiki 会按需下载语言语法文件
    // 使用 CSS Variables 双主题模式：一份 HTML 同时包含 light/dark 两套颜色，
    // 由项目的 .dark class 控制显示哪套，主题切换即时生效无需重新高亮
    codeToHtml(code, {
      lang: language || "text",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    })
      .then((result) => {
        highlightCache.set(cacheKey, result);
        setHtml(result);
      })
      .catch(() => {
        // 语言不支持时回退到纯文本
        setHtml(null);
      });
  }, [language, code]);

  async function handleCopy() {
    let ok = false;

    // Clipboard API — 仅安全上下文
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        ok = true;
      } catch {
        // fall through
      }
    }

    // execCommand fallback — HTTP 内网环境
    if (!ok) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.left = "0";
        textarea.style.top = "0";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        ok = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        // execCommand 也失败
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border bg-muted/50 dark:bg-[#24292e]">
      {/* 语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between border-border/50 border-b px-4 py-1.5 text-muted-foreground text-xs">
        <span>{language || "text"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          {copied ? tCommon("copied") : tCommon("copy")}
        </button>
      </div>
      {/* 代码内容 */}
      {html ? (
        <HighlightedCode html={html} />
      ) : (
        <pre className="overflow-x-auto p-4 text-foreground text-sm">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

/** react-markdown 自定义组件映射 */
const markdownComponents = {
  // 代码块：区分行内代码和代码块
  code(props: ComponentPropsWithoutRef<"code"> & { className?: string }) {
    const { children, className, ...rest } = props;
    const match = className?.match(/language-(\w+)/);
    const code = String(children).replace(/\n$/, "");

    // 判断是否为代码块（有 language 类名或内容包含换行）
    if (match || code.includes("\n")) {
      return <CodeBlock language={match?.[1] ?? ""} code={code} />;
    }

    // 行内代码
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground text-sm" {...rest}>
        {children}
      </code>
    );
  },

  // 段落
  p(props: ComponentPropsWithoutRef<"p">) {
    return <p className="mb-3 leading-relaxed last:mb-0" {...props} />;
  },

  // 标题
  h1(props: ComponentPropsWithoutRef<"h1">) {
    return <h1 className="mt-5 mb-3 font-bold text-xl" {...props} />;
  },
  h2(props: ComponentPropsWithoutRef<"h2">) {
    return <h2 className="mt-4 mb-2 font-bold text-lg" {...props} />;
  },
  h3(props: ComponentPropsWithoutRef<"h3">) {
    return <h3 className="mt-3 mb-2 font-semibold text-base" {...props} />;
  },

  // 列表
  ul(props: ComponentPropsWithoutRef<"ul">) {
    return <ul className="mb-3 list-disc space-y-1 pl-6" {...props} />;
  },
  ol(props: ComponentPropsWithoutRef<"ol">) {
    return <ol className="mb-3 list-decimal space-y-1 pl-6" {...props} />;
  },
  li(props: ComponentPropsWithoutRef<"li">) {
    return <li className="leading-relaxed" {...props} />;
  },

  // 链接
  a(props: ComponentPropsWithoutRef<"a">) {
    return (
      <a
        className="text-primary underline underline-offset-2 hover:text-primary/80"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },

  // 引用
  blockquote(props: ComponentPropsWithoutRef<"blockquote">) {
    return (
      <blockquote className="my-3 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic" {...props} />
    );
  },

  // 表格
  table(props: ComponentPropsWithoutRef<"table">) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...props} />
      </div>
    );
  },
  thead(props: ComponentPropsWithoutRef<"thead">) {
    return <thead className="border-b" {...props} />;
  },
  th(props: ComponentPropsWithoutRef<"th">) {
    return <th className="px-3 py-2 text-left font-semibold" {...props} />;
  },
  td(props: ComponentPropsWithoutRef<"td">) {
    return <td className="border-t px-3 py-2" {...props} />;
  },

  // 水平线
  hr(props: ComponentPropsWithoutRef<"hr">) {
    return <hr className="my-4 border-muted" {...props} />;
  },

  // 强调
  strong(props: ComponentPropsWithoutRef<"strong">) {
    return <strong className="font-semibold" {...props} />;
  },
};

interface MarkdownRendererProps {
  content: string;
}

/** Markdown 渲染器 — 使用 memo 避免不必要的重渲染 */
export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose-sm max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
