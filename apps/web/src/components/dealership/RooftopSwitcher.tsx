"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, ChevronsUpDown, Loader2 } from "lucide-react";

import { RooftopSwitcherList } from "@/components/dealership/RooftopSwitcherList";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDealershipSwitcher } from "@/hooks/useDealershipSwitcher";
import { cn } from "@/lib/utils";
import { useDealership } from "@/providers/DealershipProvider";

type RooftopSwitcherVariant = "sidebar" | "mobile" | "compact";

interface RooftopSwitcherProps {
  variant?: RooftopSwitcherVariant;
  collapsed?: boolean;
  className?: string;
  settingsHref?: string;
}

export function RooftopSwitcher({
  variant = "mobile",
  collapsed = false,
  className,
  settingsHref = "/dashboard/settings",
}: RooftopSwitcherProps) {
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
    if (!open || variant === "mobile") {
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
  }, [open, variant]);

  function close() {
    setOpen(false);
  }

  function handleSelectAll(group: Parameters<typeof selectAllRooftops>[0]) {
    selectAllRooftops(group);
    close();
  }

  function handleSelectDealership(
    group: Parameters<typeof selectDealership>[0],
    nextDealershipId: string,
  ) {
    selectDealership(group, nextDealershipId);
    close();
  }

  const list = (
    <RooftopSwitcherList
      groups={groups}
      error={error}
      rooftopScope={rooftopScope}
      activeDealershipId={activeDealershipId}
      organizationId={organizationId}
      theme={variant === "sidebar" ? "dark" : "light"}
      onSelectAll={handleSelectAll}
      onSelectDealership={handleSelectDealership}
    />
  );

  if (!dealershipId) {
    return (
      <Link
        href={settingsHref}
        className={cn(
          variant === "sidebar"
            ? cn(
                "mb-2 flex shrink-0 items-center rounded-[10px] border border-white/7 bg-white/4 transition-colors hover:bg-white/6",
                collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2.5",
              )
            : "flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5",
          className,
        )}
        title={collapsed ? "Set dealership" : undefined}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary text-white",
            variant === "compact" ? "size-8" : "size-[30px]",
          )}
        >
          <Building2 className="size-4" strokeWidth={2} />
        </div>
        {variant !== "compact" && !collapsed ? (
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-semibold",
                variant === "sidebar"
                  ? "text-[13.5px] text-white"
                  : "text-sm text-foreground",
              )}
            >
              Set dealership
            </p>
            <p
              className={cn(
                "truncate text-[11px]",
                variant === "sidebar" ? "text-[#6B7771]" : "text-muted-foreground",
              )}
            >
              Open Settings
            </p>
          </div>
        ) : null}
      </Link>
    );
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-haspopup="listbox"
      title={collapsed ? primaryTitle : undefined}
      className={cn(
        variant === "sidebar"
          ? cn(
              "flex w-full cursor-pointer items-center rounded-[10px] border border-white/7 bg-white/4 transition-colors hover:bg-white/6",
              open && "border-primary/40 bg-white/6",
              collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-2.5",
            )
          : variant === "compact"
            ? "flex min-w-0 flex-1 items-center gap-1 text-left"
            : "flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition-colors active:bg-muted/50",
        className,
      )}
    >
      {variant !== "compact" ? (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary text-white",
            variant === "sidebar" ? "size-[30px]" : "size-9",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Building2 className="size-4" strokeWidth={2} />
          )}
        </div>
      ) : (
        <Building2 className="size-3 shrink-0 text-muted-foreground" strokeWidth={2} />
      )}
      {!collapsed ? (
        <>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-semibold",
                variant === "sidebar"
                  ? "text-[13.5px] text-white"
                  : variant === "compact"
                    ? "truncate text-xs text-muted-foreground"
                    : "text-sm text-foreground",
              )}
            >
              {variant === "compact" ? (
                <>
                  <span className="truncate">{primaryTitle}</span>
                  {subtitle ? (
                    <span className="text-muted-foreground"> · {subtitle}</span>
                  ) : null}
                </>
              ) : (
                primaryTitle
              )}
            </p>
            {variant !== "compact" ? (
              <p
                className={cn(
                  "truncate text-[11px]",
                  variant === "sidebar" ? "text-[#6B7771]" : "text-muted-foreground",
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <ChevronsUpDown
            className={cn(
              "shrink-0",
              variant === "sidebar"
                ? "ml-auto size-4 text-[#6B7771]"
                : variant === "compact"
                  ? "size-3.5 text-muted-foreground"
                  : "size-4 text-muted-foreground",
            )}
            strokeWidth={2}
          />
        </>
      ) : (
        <ChevronsUpDown className="absolute -right-0.5 -bottom-0.5 size-3 text-[#6B7771]" />
      )}
    </button>
  );

  if (variant === "sidebar") {
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
            className,
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
            {list}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {trigger}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[75dvh] rounded-t-2xl px-0 pb-8">
          <SheetHeader className="px-4 text-left">
            <SheetTitle>Switch rooftop</SheetTitle>
            <SheetDescription>
              Choose a dealership or view all rooftops in your group.
            </SheetDescription>
          </SheetHeader>
          <div
            role="listbox"
            aria-label="Switch dealer group or rooftop"
            className="max-h-[50dvh] overflow-y-auto py-1"
          >
            {list}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
