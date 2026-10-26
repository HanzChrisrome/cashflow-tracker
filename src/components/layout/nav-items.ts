import {
  ArrowLeftRight,
  CalendarClock,
  ChartNoAxesColumn,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Receipt,
  Repeat,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Main Menu",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Analytics", url: "/analytics", icon: ChartNoAxesColumn },
      { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
      { title: "Invoices", url: "/invoices", icon: Receipt, badge: "12" },
    ],
  },
  {
    label: "Features",
    items: [
      { title: "Recurring", url: "/recurring", icon: Repeat },
      {
        title: "Subscriptions",
        url: "/subscriptions",
        icon: CalendarClock,
      },
      { title: "Feedback", url: "/feedback", icon: MessageSquare, badge: "3" },
    ],
  },
  {
    label: "General",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Help Desk", url: "/help-desk", icon: LifeBuoy },
      { title: "Log out", icon: LogOut },
    ],
  },
];

export function isNavItemActive(pathname: string, url?: string) {
  if (!url) return false;
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function pageTitleFromPathname(pathname: string) {
  for (const group of navGroups) {
    const item = group.items.find((item) =>
      isNavItemActive(pathname, item.url),
    );
    if (item) return item.title;
  }
  return "";
}
