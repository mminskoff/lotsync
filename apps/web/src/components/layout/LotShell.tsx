"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoMark } from "@/components/brand/LogoMark";
import { BottomNav } from "@/components/layout/BottomNav";
import { useDealership } from "@/providers/DealershipProvider";

function pageTitle(pathname: string): string | null {
  if (pathname.startsWith("/pairing")) return null;
  if (pathname.startsWith("/vehicles")) return "Lookup";
  if (pathname.startsWith("/audit-log")) return "History";
  if (pathname.startsWith("/settings")) return "Settings";
  return null;
}

export function LotShell({ children }: { children: React.ReactNode }) {
  const { dealershipId } = useDealership();
  const pathname = usePathname();
  const title = pageTitle(pathname);
  const isPairing = pathname.startsWith("/pairing");

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      {!isPairing ? (
        <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[640px] items-center justify-between gap-3 px-4 py-3">
            <Link href="/pairing" className="flex min-w-0 items-center gap-2.5">
              <LogoMark size="sm" />
              <span className="truncate text-base font-semibold tracking-tight">LotSync</span>
            </Link>
            {title ? (
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            ) : null}
          </div>
        </header>
      ) : null}

      {!dealershipId ? (
        <div className="border-b border-[#f0dca8] bg-status-pending/15 px-4 py-2 text-center text-xs font-medium text-status-pending">
          Set your dealership ID in Settings before pairing.
        </div>
      ) : null}

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>

      <BottomNav />
    </div>
  );
}
