"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Leaf,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { categories, kinds } from "@/lib/records";
import { api, ApiError } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { AuthContext, type User } from "./auth-context";
import { Login } from "./login";
import { PageSkeleton } from "./page-skeleton";
const navigation = [
  { href: "/", label: "狀態總覽", icon: LayoutDashboard },
  ...kinds.map((kind) => ({
    href: kind === "appointment" ? "/calendar" : `/records/${kind}`,
    label: categories[kind].label,
    icon: categories[kind].icon,
  })),
  { href: "/report", label: "回診摘要", icon: FileText },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => setThemeReady(true), []);
  const expire = useCallback(() => setUser(null), []);
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User }>("/auth/me", { signal: controller.signal })
      .then((result) => setUser(result.user))
      .catch((e) => {
        if (
          e.name !== "AbortError" &&
          !(e instanceof ApiError && e.status === 401)
        )
          setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => controller.abort();
  }, []);
  async function logout() {
    try {
      await api("/auth/logout", { method: "POST", body: "{}" });
      setUser(null);
      toast.add({ title: "已登出", type: "success" });
    } catch (e) {
      toast.add({
        title: "無法登出",
        description: (e as Error).message,
        type: "error",
      });
    }
  }
  if (
    pathname !== "/login" &&
    !navigation.some((item) => item.href === pathname)
  )
    return <>{children}</>;
  if (checking && pathname === "/login") return <PageSkeleton />;
  if (!checking && !user)
    return (
      <Login
        initialError={error}
        onLogin={async (next) => {
          setError("");
          setUser(next);
        }}
      />
    );
  return (
    <AuthContext.Provider value={{ user, refreshTick, expire }}>
      <SidebarProvider>
        <NavigationSidebar user={user} onLogout={logout} />
        <SidebarInset className="min-w-0 print:m-0 print:shadow-none">
          <a href="#main" className="sr-only focus:not-sr-only">
            跳至主要內容
          </a>
          <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6 print:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger aria-label="切換側邊欄" />
              <Breadcrumb aria-label="頁面導覽">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/" />}>
                      self
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {navigation.find((item) => item.href === pathname)
                        ?.label || "我的空間"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" aria-label="切換外觀" />
                  }
                >
                  {themeReady && resolvedTheme === "dark" ? <Moon /> : <Sun />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun />
                    淺色
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon />
                    深色
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor />
                    跟隨系統
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                aria-label="重新整理紀錄"
                disabled={checking}
                onClick={() => setRefreshTick((n) => n + 1)}
              >
                <RefreshCw />
              </Button>
            </div>
          </header>
          {checking ? <PageSkeleton /> : children}
        </SidebarInset>
      </SidebarProvider>
    </AuthContext.Provider>
  );
}
function NavigationSidebar({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar variant="inset" collapsible="icon" className="print:hidden">
      <SidebarHeader className="py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-5" />
              </span>
              <span className="text-xl font-semibold">
                self{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  日常照顧
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>我的空間</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    render={
                      <Link
                        href={item.href}
                        aria-current={
                          pathname === item.href ? "page" : undefined
                        }
                      />
                    }
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="私人紀錄" disabled>
              <ShieldCheck />
              <span>{user?.name || "我的私人空間"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="登出"
              onClick={onLogout}
              disabled={!user}
            >
              <LogOut />
              <span>登出</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
