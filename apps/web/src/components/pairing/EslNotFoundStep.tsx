"use client";

import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";

interface EslNotFoundStepProps {
  deviceCode: string;
  onScanAgain: () => void;
  onManual: () => void;
  onBack: () => void;
}

export function EslNotFoundStep({
  deviceCode,
  onScanAgain,
  onManual,
  onBack,
}: EslNotFoundStepProps) {
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
        <h2 className="text-[17px] font-semibold">Tag not recognized</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[var(--status-failed-bg)] text-[var(--status-failed)]">
          <Tag className="size-8" strokeWidth={1.9} />
        </div>
        <h3 className="text-[21px] font-semibold tracking-tight">Unknown tag</h3>
        <p className="mt-2 max-w-[30ch] text-[13.5px] leading-relaxed text-muted-foreground">
          This ESL isn&apos;t registered yet, or the scan failed to read.
        </p>
        <div className="mt-4 rounded-[10px] border border-border bg-background px-3.5 py-2.5 font-mono text-[13px] text-[var(--status-failed)]">
          {deviceCode || "ESL-?????"}
        </div>
      </div>

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button type="button" size="lg" className="w-full font-semibold" onClick={onScanAgain}>
          Scan again
        </Button>
        <Button type="button" size="lg" variant="secondary" className="w-full" onClick={onManual}>
          Enter tag ID manually
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
