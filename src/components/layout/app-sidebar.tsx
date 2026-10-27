import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Search, Wallet } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isNavItemActive, navGroups } from "@/components/layout/nav-items";
import { useEffect } from "react";

export function AppSidebar() {
  const location = useLocation();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  async function logout() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/login" });
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm font-semibold">Cashflow</span>
            <span className="text-xs text-muted-foreground">Tracker</span>
          </span>
        </Link>
        <div className="relative mt-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            aria-label="Search"
            className="h-9 rounded-xl border-transparent bg-muted pr-12 pl-9 focus-visible:border-transparent"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-2">
            <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.url ? (
                      <SidebarMenuButton
                        render={<Link to={item.url} />}
                        isActive={isNavItemActive(location.pathname, item.url)}
                        className="h-9 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-[18px]"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton
                        onClick={logout}
                        className="h-9 rounded-xl px-3 text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-[18px]"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                    {item.badge && (
                      <SidebarMenuBadge className="text-[11px] font-medium text-muted-foreground">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
