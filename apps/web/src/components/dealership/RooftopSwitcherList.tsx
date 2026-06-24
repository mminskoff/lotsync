"use client";

import { Check } from "lucide-react";

import { groupKey } from "@/hooks/useDealershipSwitcher";
import { cn } from "@/lib/utils";
import type { RooftopGroup } from "@/lib/types/dealership";
import type { RooftopScope } from "@/lib/dealership-storage";

export function isAllRooftopsSelected(
  group: RooftopGroup,
  rooftopScope: RooftopScope,
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

type Theme = "dark" | "light";

const themeStyles = {
  dark: {
    empty: "text-[#6B7771]",
    groupLabel: "text-[#566159]",
    divider: "border-white/8",
    optionActive: "bg-primary/20 text-white",
    optionIdle: "text-[#c5ccc8] hover:bg-white/5 hover:text-white",
    count: "text-[#6B7771]",
    check: "text-green-400",
  },
  light: {
    empty: "text-muted-foreground",
    groupLabel: "text-muted-foreground",
    divider: "border-border",
    optionActive: "bg-primary/10 text-foreground",
    optionIdle: "text-foreground hover:bg-muted",
    count: "text-muted-foreground",
    check: "text-primary",
  },
} as const;

interface RooftopSwitcherListProps {
  groups: RooftopGroup[];
  error: string | null;
  rooftopScope: RooftopScope;
  activeDealershipId: string;
  organizationId: string | null;
  theme?: Theme;
  onSelectAll: (group: RooftopGroup) => void;
  onSelectDealership: (group: RooftopGroup, dealershipId: string) => void;
}

export function RooftopSwitcherList({
  groups,
  error,
  rooftopScope,
  activeDealershipId,
  organizationId,
  theme = "light",
  onSelectAll,
  onSelectDealership,
}: RooftopSwitcherListProps) {
  const styles = themeStyles[theme];

  if (groups.length === 0) {
    return (
      <p className={cn("px-3 py-2 text-sm", styles.empty)}>
        {error ? "Cannot load rooftops" : "No rooftops available"}
      </p>
    );
  }

  return (
    <>
      {groups.map((group, groupIndex) => {
        const showAll =
          group.organization_id !== null || group.dealerships.length > 1;
        const allActive = isAllRooftopsSelected(
          group,
          rooftopScope,
          activeDealershipId,
          organizationId,
        );

        return (
          <div key={groupKey(group)}>
            {groupIndex > 0 ? (
              <div className={cn("my-1 border-t", styles.divider)} />
            ) : null}
            <p
              className={cn(
                "px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase",
                styles.groupLabel,
              )}
            >
              {group.organization_name}
            </p>
            {showAll ? (
              <button
                type="button"
                role="option"
                aria-selected={allActive}
                onClick={() => onSelectAll(group)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  allActive ? styles.optionActive : styles.optionIdle,
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  All rooftops
                  <span className={cn("ml-1 text-[11px]", styles.count)}>
                    ({group.dealerships.length})
                  </span>
                </span>
                {allActive ? (
                  <Check className={cn("size-4 shrink-0", styles.check)} />
                ) : null}
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
                  onClick={() => onSelectDealership(group, dealer.id)}
                  className={cn(
                    "flex w-full items-center gap-2 py-2.5 pr-3 text-left text-sm transition-colors",
                    showAll ? "pl-6" : "pl-3",
                    selected ? styles.optionActive : styles.optionIdle,
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{dealer.name}</span>
                  {selected ? (
                    <Check className={cn("size-4 shrink-0", styles.check)} />
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
