/**
 * next-intl 服务端请求配置
 *
 * 每个请求根据 cookie 决定使用的语言。
 * 无 URL 前缀模式（cookie-based），不需要 routing.ts。
 */
import { cookies } from "next/headers";

import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale, SUPPORTED_LOCALES } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  // 验证 cookie 中的 locale 是否合法，不合法则用默认值
  const locale: Locale = SUPPORTED_LOCALES.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
