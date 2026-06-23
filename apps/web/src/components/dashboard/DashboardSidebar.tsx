"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  Link2,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Tag,
  Users,
  Zap,
} from "lucide-react";

import { LogoMark } from "@/components/brand/LogoMark";
import { DealershipSwitcher } from "@/components/dashboard/DealershipSwitcher";
import { canManageUsers } from "@/components/auth/RequireUserManager";
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
      { href: "/dashboard/inventory-sources", label: "Inventory", icon: FileSpreadsheet },
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

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center rounded-lg text-sm transition-colors",
        collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-2",
        active
          ? "bg-primary/16 text-white"
          : "text-[#9BA6A1] hover:bg-white/5 hover:text-[#e6e9e7]",
      )}
    >
      <Icon
        className={cn("size-[18px] shrink-0", active && "text-green-400")}
        strokeWidth={1.8}
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      {badge ? (
        collapsed ? (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-[var(--status-failed)]" />
        ) : (
          <span className="ml-auto rounded-full bg-[var(--status-failed)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {badge}
          </span>
        )
      ) : null}
    </Link>
  );
}

export function DashboardSidebar({
  collapsed = false,
  onToggleCollapsed,
  pendingSyncCount = 0,
  mismatchCount = 0,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  pendingSyncCount?: number;
  mismatchCount?: number;
}) {
  const pathname = usePathname();
  const { session } = useAuth();

  const manageItems = [
    ...navGroups.find((g) => g.label === "Manage")!.items,
    ...(session && canManageUsers(session.role)
      ? [{ href: "/dashboard/users", label: "Team", icon: Users as typeof LayoutGrid }]
      : []),
  ];

  const groups = navGroups.map((group) =>
    group.label === "Manage" ? { ...group, items: manageItems } : group,
  );

  function badgeFor(key: "sync" | "mismatch" | undefined): number | undefined {
    if (key === "sync" && pendingSyncCount > 0) return pendingSyncCount;
    if (key === "mismatch" && mismatchCount > 0) return mismatchCount;
    return undefined;
  }

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16 px-2 py-3" : "w-[248px] px-3 py-3.5",
      )}
    >
      <DealershipSwitcher collapsed={collapsed} />

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-hidden">
        {groups.map((group) => (
          <div key={group.label} className="mb-0.5">
            {!collapsed ? (
              <p className="px-2.5 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-wider text-[#566159] uppercase">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const { href, label, icon, badgeKey } = item;
              const active =
                "exact" in item && item.exact ? pathname === href : pathname.startsWith(href);
              return (
                <NavItem
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  active={active}
                  collapsed={collapsed}
                  badge={badgeFor(badgeKey)}
                />
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto shrink-0 space-y-0.5 border-t border-white/10 pt-2">
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center rounded-lg text-sm text-[#9BA6A1] transition-colors hover:bg-white/5 hover:text-[#e6e9e7]",
              collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-2",
            )}
          >
            {collapsed ? (
              <PanelLeft className="size-[18px]" strokeWidth={1.8} />
            ) : (
              <>
                <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />
                <span>Collapse</span>
              </>
            )}
          </button>
        ) : null}

        <NavItem
          href="/dashboard/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/dashboard/settings")}
          collapsed={collapsed}
        />

        <NavItem
          href="/pairing"
          label="Lot pairing app"
          icon={Link2}
          active={false}
          collapsed={collapsed}
        />

        {session ? (
          <div
            className={cn(
              "flex items-center py-2",
              collapsed ? "justify-center px-0" : "gap-2.5 px-2.5",
            )}
            title={collapsed ? session.displayName : undefined}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
              {initials(session.displayName)}
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-white">{session.displayName}</p>
                <p className="truncate text-[11px] text-[#6B7771]">{roleLabel(session.role)}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function DashboardBrandBar() {
  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border/80 bg-background/85 px-6 backdrop-blur-md">
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
