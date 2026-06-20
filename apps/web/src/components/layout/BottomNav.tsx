"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Clock3, Link2, Search, Settings } from "lucide-react";

const tabs = [
  { href: "/pairing", label: "Pair", icon: Link2 },
  { href: "/vehicles", label: "Lookup", icon: Search },
  { href: "/audit-log", label: "History", icon: Clock3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-border bg-background px-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-1.5">
      <div className="mx-auto flex max-w-[640px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-medium transition-colors",
                active
                  ? "bg-green-50 font-semibold text-green-700"
                  : "text-neutral-400",
              )}
            >
              <Icon className={cn("size-[22px]", active && "stroke-[2.25]")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
