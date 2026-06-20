"use client";

import { ArrowRight, Clock3, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/brand/LogoMark";
import { Badge } from "@/components/ui/badge";
import { listVehicles } from "@/lib/vehiclesApi";
import { useAuth } from "@/providers/AuthProvider";
import { useDealership } from "@/providers/DealershipProvider";

interface PairHomeStepProps {
  onStartPairing: () => void;
  onLookup: () => void;
  onRecent: () => void;
}

export function PairHomeStep({ onStartPairing, onLookup, onRecent }: PairHomeStepProps) {
  const { session } = useAuth();
  const { dealershipId } = useDealership();
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!dealershipId) {
      setLoadingStatus(false);
      return;
    }

    let cancelled = false;
    void listVehicles()
      .then((vehicles) => {
        if (cancelled) return;
        const pending = vehicles.filter(
          (v) => v.sync_status?.toUpperCase() === "PENDING",
        ).length;
        setPendingCount(pending);
      })
      .catch(() => {
        if (!cancelled) setPendingCount(0);
      })
      .finally(() => {
        if (!cancelled) setLoadingStatus(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dealershipId]);

  const firstName = session?.displayName ?? "there";

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">Lot operations</p>
          <h1 className="text-[22px] font-semibold tracking-tight">Hi {firstName}</h1>
        </div>
        {!loadingStatus ? (
          pendingCount > 0 ? (
            <Badge variant="pending" className="h-auto gap-1.5 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              {pendingCount} pending
            </Badge>
          ) : (
            <Badge variant="synced" className="h-auto gap-1.5 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              All synced
            </Badge>
          )
        ) : null}
      </div>

      <button
        type="button"
        onClick={onStartPairing}
        className="relative overflow-hidden rounded-[22px] bg-primary p-6 text-left text-primary-foreground shadow-md transition active:scale-[0.99]"
      >
        <span
          className="pointer-events-none absolute -top-8 -right-8 size-[140px] rounded-full border-[18px] border-white/12"
          aria-hidden
        />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <LogoMark size="sm" className="bg-white/20 shadow-none" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Pair
            </span>
          </div>
          <h2 className="text-[21px] font-semibold tracking-tight">Pair a vehicle</h2>
          <p className="mt-1 max-w-[22ch] text-[13px] leading-snug text-white/85">
            Scan a VIN, then its tag. Done in seconds.
          </p>
          <div className="mt-[18px] flex h-[46px] items-center justify-center gap-2 rounded-[14px] bg-white text-[15px] font-semibold text-green-800">
            Start pairing
            <ArrowRight className="size-[18px]" strokeWidth={2.2} />
          </div>
        </div>
      </button>

      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onLookup}
          className="rounded-2xl border border-border bg-background p-4 text-left transition active:bg-neutral-50"
        >
          <div className="mb-3 flex size-[38px] items-center justify-center rounded-[11px] bg-green-50 text-green-700">
            <Search className="size-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold">Look up</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Find a vehicle</p>
        </button>
        <button
          type="button"
          onClick={onRecent}
          className="rounded-2xl border border-border bg-background p-4 text-left transition active:bg-neutral-50"
        >
          <div className="mb-3 flex size-[38px] items-center justify-center rounded-[11px] bg-green-50 text-green-700">
            <Clock3 className="size-5" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-semibold">Recent</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Pairing history</p>
        </button>
      </div>
    </div>
  );
}
