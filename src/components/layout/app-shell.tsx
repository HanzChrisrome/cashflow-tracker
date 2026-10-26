import type { ReactNode } from "react";
import { useLocation, useRouter } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Mail,
  Share2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { pageTitleFromPathname } from "@/components/layout/nav-items";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const location = useLocation();
  const title = pageTitleFromPathname(location.pathname) || "Overview";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 border-b bg-background px-3 md:px-5">
          <SidebarTrigger />
          <div className="hidden items-center sm:flex">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Go back"
              onClick={() => router.history.back()}
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Go forward"
              onClick={() => router.history.forward()}
            >
              <ChevronRight />
            </Button>
          </div>
          <Breadcrumb className="ml-1 min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <span className="text-muted-foreground">Pages</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate font-medium">
                  {title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Help"
              className="hidden size-9 rounded-full sm:inline-flex"
            >
              <CircleHelp />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mail"
              className="hidden size-9 rounded-full sm:inline-flex"
            >
              <Mail />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Notifications"
              className="size-9 rounded-full"
            >
              <Bell />
            </Button>
            <Avatar className="hidden size-9 sm:flex">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button size="sm" className="h-9 gap-1.5 rounded-xl">
              <Share2 />
              Share
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
