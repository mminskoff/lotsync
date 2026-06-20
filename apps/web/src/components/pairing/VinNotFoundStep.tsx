"use client";

import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";

interface VinNotFoundStepProps {
  vin: string;
  onScanAgain: () => void;
  onManual: () => void;
  onBack: () => void;
}

export function VinNotFoundStep({
  vin,
  onScanAgain,
  onManual,
  onBack,
}: VinNotFoundStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-sm font-medium text-primary"
        >
          ← Back
        </button>
        <h2 className="text-[17px] font-semibold">VIN not found</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[var(--status-failed-bg)] text-[var(--status-failed)]">
          <SearchX className="size-9" strokeWidth={2} />
        </div>
        <h3 className="text-[21px] font-semibold tracking-tight">Not in inventory</h3>
        <p className="mt-2 max-w-[30ch] text-[13.5px] leading-relaxed text-muted-foreground">
          We couldn&apos;t match this VIN to any vehicle on your lot.
        </p>
        <div className="mt-4 rounded-[10px] border border-border bg-background px-3.5 py-2.5 font-mono text-[13px]">
          {vin}
        </div>
      </div>

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button type="button" size="lg" className="w-full font-semibold" onClick={onScanAgain}>
          Scan again
        </Button>
        <Button type="button" size="lg" variant="secondary" className="w-full" onClick={onManual}>
          Enter VIN manually
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
