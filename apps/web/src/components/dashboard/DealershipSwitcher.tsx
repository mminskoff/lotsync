"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { groupKey, useDealershipSwitcher } from "@/hooks/useDealershipSwitcher";
import { cn } from "@/lib/utils";
import type { RooftopGroup } from "@/lib/types/dealership";
import { useDealership } from "@/providers/DealershipProvider";

function isAllSelected(
  group: RooftopGroup,
  rooftopScope: string,
  activeDealershipId: string,
  organizationId: string | null,
): boolean {
  if (rooftopScope !== "all") {
    return false;
  }
  if (group.organization_id) {
    return organizationId === group.organization_id;
  }
  return group.dealerships.some((dealer) => dealer.id === activeDealershipId);
}

export function DealershipSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { dealershipId, organizationId } = useDealership();
  const {
    groups,
    primaryTitle,
    subtitle,
    isLoading,
    error,
    rooftopScope,
    activeDealershipId,
    selectAllRooftops,
    selectDealership,
  } = useDealershipSwitcher();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!dealershipId) {
    return (
      <Link
        href="/dashboard/settings"
        className={cn(
          "mb-2 flex shrink-0 items-center rounded-[10px] border border-white/7 bg-white/4 transition-colors hover:bg-white/6",
          collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2.5",
        )}
        title={collapsed ? "Set dealership" : undefined}
      >
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <Building2 className="size-4" strokeWidth={2} />
        </div>
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-white">Set dealership</p>
            <p className="truncate text-[11px] text-[#6B7771]">Open Settings</p>
          </div>
        ) : null}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative z-20 mb-2 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={collapsed ? primaryTitle : undefined}
        className={cn(
          "flex w-full cursor-pointer items-center rounded-[10px] border border-white/7 bg-white/4 transition-colors hover:bg-white/6",
          open && "border-primary/40 bg-white/6",
          collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2.5",
        )}
      >
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Building2 className="size-4" strokeWidth={2} />
          )}
        </div>
        {!collapsed ? (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[13.5px] font-semibold text-white">{primaryTitle}</p>
              <p className="truncate text-[11px] text-[#6B7771]">{subtitle}</p>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-[#6B7771]" strokeWidth={2} />
          </>
        ) : (
          <ChevronsUpDown className="absolute -right-0.5 -bottom-0.5 size-3 text-[#6B7771]" />
        )}
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Switch dealer group or rooftop"
          className={cn(
            "absolute z-[100] max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#1a211e] py-1 shadow-xl",
            collapsed ? "left-full top-0 ml-2 w-64" : "left-0 right-0 top-[calc(100%+6px)]",
          )}
        >
          {groups.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[#6B7771]">
              {error ? "Cannot load rooftops" : "No rooftops available"}
            </p>
          ) : (
            groups.map((group, groupIndex) => {
              const showAll =
                group.organization_id !== null || group.dealerships.length > 1;
              const allActive = isAllSelected(
                group,
                rooftopScope,
                activeDealershipId,
                organizationId,
              );

              return (
                <div key={groupKey(group)}>
                  {groupIndex > 0 ? <div className="my-1 border-t border-white/8" /> : null}
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-[#566159] uppercase">
                    {group.organization_name}
                  </p>
                  {showAll ? (
                    <button
                      type="button"
                      role="option"
                      aria-selected={allActive}
                      onClick={() => {
                        selectAllRooftops(group);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                        allActive
                          ? "bg-primary/20 text-white"
                          : "text-[#c5ccc8] hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        All rooftops
                        <span className="ml-1 text-[11px] text-[#6B7771]">
                          ({group.dealerships.length})
                        </span>
                      </span>
                      {allActive ? <Check className="size-4 shrink-0 text-green-400" /> : null}
                    </button>
                  ) : null}
                  {group.dealerships.map((dealer) => {
                    const selected =
                      rooftopScope === "single" && dealer.id === activeDealershipId;
                    return (
                      <button
                        key={dealer.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          selectDealership(group, dealer.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 py-2 pr-3 text-left text-sm transition-colors",
                          showAll ? "pl-6" : "pl-3",
                          selected
                            ? "bg-primary/20 text-white"
                            : "text-[#c5ccc8] hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{dealer.name}</span>
                        {selected ? (
                          <Check className="size-4 shrink-0 text-green-400" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
