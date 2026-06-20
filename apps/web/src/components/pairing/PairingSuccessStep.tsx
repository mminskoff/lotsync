"use client";

import Link from "next/link";
import { Check, Clock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";
import { formatVehicleTitle } from "@/lib/format";
import type { PairingResponse } from "@/lib/types/pairing";

interface PairingSuccessStepProps {
  result: PairingResponse;
  pairingDurationSec?: number | null;
  isLoading?: boolean;
  error?: string | null;
  onResync: () => void;
  onUnpair: () => void;
  onReset: () => void;
  onDone: () => void;
}

function syncStatusVariant(status: string): "synced" | "pending" | "failed" | "offline" {
  const normalized = status.toUpperCase();
  if (normalized === "PENDING") return "pending";
  if (normalized === "FAILED") return "failed";
  if (normalized === "OFFLINE") return "offline";
  return "synced";
}

export function PairingSuccessStep({
  result,
  pairingDurationSec,
  isLoading,
  error,
  onResync,
  onUnpair,
  onReset,
  onDone,
}: PairingSuccessStepProps) {
  const title = formatVehicleTitle(result.vehicle);
  const sync = result.sync_event;

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-6 flex size-24 items-center justify-center rounded-full bg-green-50">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white">
            <Check className="size-[34px]" strokeWidth={2.6} />
          </div>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight">Paired!</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {title} is now linked to{" "}
          <span className="font-mono font-medium text-foreground">{result.device.device_id}</span>
        </p>

        {pairingDurationSec != null && pairingDurationSec > 0 ? (
          <div className="mt-[18px] inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-[13px] font-medium text-green-800">
            <Clock className="size-3.5" strokeWidth={2} />
            Paired in {pairingDurationSec}s
          </div>
        ) : null}

        {sync ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant={syncStatusVariant(sync.status)}>
              Label sync · {sync.status.toLowerCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">{sync.event_type.replace(".", " · ")}</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <Alert variant="destructive" className="mx-5 mb-4">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button type="button" size="lg" className="w-full font-semibold" disabled={isLoading} onClick={onReset}>
          Pair another
        </Button>
        <Button type="button" size="lg" variant="secondary" className="w-full" disabled={isLoading} onClick={onDone}>
          Done
        </Button>
        <div className="flex justify-center gap-4 pt-1 text-xs text-muted-foreground">
          <button type="button" className="hover:text-foreground hover:underline disabled:opacity-50" disabled={isLoading} onClick={onResync}>
            Resync tag
          </button>
          <span aria-hidden>·</span>
          <Link href={`/vehicles?vin=${encodeURIComponent(result.vehicle.vin)}`} className="hover:text-primary hover:underline">
            View vehicle
          </Link>
          <span aria-hidden>·</span>
          <button type="button" className="hover:text-destructive hover:underline disabled:opacity-50" disabled={isLoading} onClick={onUnpair}>
            Unpair
          </button>
        </div>
      </FlowStickyFooter>
    </div>
  );
}
