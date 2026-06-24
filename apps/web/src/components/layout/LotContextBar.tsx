"use client";

import Link from "next/link";
import { ChevronRight, User } from "lucide-react";

import { RooftopSwitcher } from "@/components/dealership/RooftopSwitcher";
import { roleLabel } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

export function LotContextBar() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  return (
    <div className="border-b border-border/80 bg-background">
      <Link
        href="/settings"
        className="flex items-center gap-3 px-4 py-2.5 transition-colors active:bg-muted/50"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
          <User className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{session.email}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {roleLabel(session.role)}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      </Link>
      <div className="border-t border-border/60 px-4 py-2">
        <RooftopSwitcher variant="mobile" settingsHref="/settings" />
      </div>
    </div>
  );
}
