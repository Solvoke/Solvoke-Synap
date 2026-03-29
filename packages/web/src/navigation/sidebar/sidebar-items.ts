/**
 * Synap 侧边栏导航配置
 *
 * 定义了 Dashboard 左侧导航的菜单结构。
 * 目前 MVP 只有三个核心页面：对话列表、搜索、设置。
 */
import { LayoutDashboard, type LucideIcon, MessageSquare, Search, Settings } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/**
 * title / label 现在是 i18n 翻译键（相对于 'sidebar' 命名空间）。
 * 在 nav-main.tsx 中通过 useTranslations('sidebar') 解析为显示文本。
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "overview",
    items: [
      {
        title: "dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: "conversations",
    items: [
      {
        title: "allConversations",
        url: "/dashboard/conversations",
        icon: MessageSquare,
      },
      {
        title: "search",
        url: "/dashboard/search",
        icon: Search,
      },
    ],
  },
  {
    id: 3,
    label: "system",
    items: [
      {
        title: "settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
    ],
  },
];
