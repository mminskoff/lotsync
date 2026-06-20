"use client";

import { Bell, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { DashboardBrandBar, DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useDashboard } from "@/providers/DashboardDataProvider";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "dashboard-sidebar-collapsed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { overview, vehicles, isLoading } = useDashboard();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const mismatchCount = vehicles.filter(
    (v) => v.sync_status?.toUpperCase() === "PRICE_MISMATCH",
  ).length;

  const pendingBadge = overview.pendingEvents + overview.pendingSyncs;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-app-bg">
      <DashboardBrandBar />
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          collapsed ? "lg:grid-cols-[64px_1fr]" : "lg:grid-cols-[248px_1fr]",
        )}
      >
        <div className="hidden h-full min-h-0 overflow-hidden lg:block">
          {!isLoading ? (
            <DashboardSidebar
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
              pendingSyncCount={pendingBadge}
              mismatchCount={mismatchCount}
            />
          ) : (
            <div className={cn("h-full bg-sidebar", collapsed ? "w-16" : "w-[248px]")} />
          )}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex h-[62px] shrink-0 items-center gap-4 border-b border-border/80 bg-app-bg/85 px-6 backdrop-blur-md lg:px-7">
            <DashboardSidebarMobile pendingSyncCount={pendingBadge} />
            <div className="relative ml-auto hidden w-[280px] sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="bg-background pl-8" placeholder="Search VIN, stock #, or tag…" />
            </div>
            <button
              type="button"
              className="ml-auto flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground sm:ml-0"
              aria-label="Notifications"
            >
              <Bell className="size-[18px]" strokeWidth={1.8} />
            </button>
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-7">{children}</main>
        </div>
      </div>
    </div>
  );
}

function DashboardSidebarMobile({ pendingSyncCount }: { pendingSyncCount: number }) {
  return (
    <nav className="flex flex-wrap gap-1 lg:hidden">
      <a href="/dashboard" className="rounded-md px-2 py-1 text-xs font-medium text-primary">
        Home
      </a>
      <a href="/dashboard/vehicles" className="rounded-md px-2 py-1 text-xs text-muted-foreground">
        Vehicles
      </a>
      <a href="/dashboard/sync-events" className="rounded-md px-2 py-1 text-xs text-muted-foreground">
        Sync{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ""}
      </a>
      <a href="/pairing" className="rounded-md px-2 py-1 text-xs text-muted-foreground">
        Lot app
      </a>
    </nav>
  );
}
