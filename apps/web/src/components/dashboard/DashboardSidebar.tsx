"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Car,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutGrid,
  Link2,
  Settings,
  Tag,
  Zap,
} from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { roleLabel } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const navGroups: {
  label: string;
  items: {
    href: string;
    label: string;
    icon: typeof LayoutGrid;
    exact?: boolean;
    badgeKey?: "sync" | "mismatch";
  }[];
}[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true }],
  },
  {
    label: "Manage",
    items: [
      { href: "/dashboard/vehicles", label: "Vehicles", icon: Car },
      { href: "/dashboard/devices", label: "ESL Devices", icon: Tag },
      { href: "/dashboard/assignments", label: "Assignments", icon: ClipboardList },
    ],
  },
  {
    label: "Monitor",
    items: [
      { href: "/dashboard/audit-log", label: "Audit Log", icon: FileText },
      { href: "/dashboard/sync-events", label: "Sync Events", icon: Zap, badgeKey: "sync" as const },
      { href: "/dashboard/mismatches", label: "Price Mismatches", icon: Link2, badgeKey: "mismatch" as const },
    ],
  },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function DashboardSidebar({
  pendingSyncCount = 0,
  mismatchCount = 0,
}: {
  pendingSyncCount?: number;
  mismatchCount?: number;
}) {
  const pathname = usePathname();
  const { session } = useAuth();

  function badgeFor(key: "sync" | "mismatch" | undefined): number | undefined {
    if (key === "sync" && pendingSyncCount > 0) return pendingSyncCount;
    if (key === "mismatch" && mismatchCount > 0) return mismatchCount;
    return undefined;
  }

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col overflow-y-auto bg-sidebar px-3 py-3.5 text-sidebar-foreground">
      <div className="mb-3.5 flex items-center gap-2.5 rounded-[10px] border border-white/7 bg-white/4 px-2.5 py-2.5">
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-white">Dealership</p>
          <p className="truncate text-[11px] text-[#6B7771]">Single rooftop</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-[#6B7771]" />
      </div>

      <nav className="flex-1 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="px-2.5 pt-3.5 pb-1.5 text-[10.5px] font-semibold tracking-wider text-[#566159] uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const { href, label, icon: Icon, badgeKey } = item;
              const active =
                "exact" in item && item.exact ? pathname === href : pathname.startsWith(href);
              const badge = badgeFor(badgeKey);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary/16 text-white"
                      : "text-[#9BA6A1] hover:bg-white/5 hover:text-[#e6e9e7]",
                  )}
                >
                  <Icon
                    className={cn("size-[18px] shrink-0", active && "text-green-400")}
                    strokeWidth={1.8}
                  />
                  <span className="truncate">{label}</span>
                  {badge ? (
                    <span className="ml-auto rounded-full bg-[var(--status-failed)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-primary/16 text-white"
              : "text-[#9BA6A1] hover:bg-white/5 hover:text-[#e6e9e7]",
          )}
        >
          <Settings className="size-[18px]" strokeWidth={1.8} />
          Settings
        </Link>
        <Link
          href="/pairing"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[#9BA6A1] transition-colors hover:bg-white/5 hover:text-[#e6e9e7]"
        >
          <Link2 className="size-[18px]" strokeWidth={1.8} />
          Lot pairing app
        </Link>
        {session ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
              {initials(session.displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">{session.displayName}</p>
              <p className="truncate text-[11px] text-[#6B7771]">{roleLabel(session.role)}</p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function DashboardBrandBar() {
  return (
    <header className="sticky top-0 z-40 flex h-[60px] items-center justify-between border-b border-border/80 bg-background/85 px-6 backdrop-blur-md">
      <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
        <LogoMark size="sm" />
        LotSync
      </Link>
      <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
        <Link href="/dashboard" className="rounded-lg px-3 py-2 text-green-800 bg-green-50">
          Dashboard
        </Link>
        <Link
          href="/pairing"
          className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Lot app
        </Link>
      </nav>
    </header>
  );
}
