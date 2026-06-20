"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CameraScanner } from "@/components/pairing/CameraScanner";
import { ManualEntryInput } from "@/components/pairing/ManualEntryInput";
import type { PairingPhase, ScanMethod } from "@/hooks/usePairingFlow";

interface VinScanStepProps {
  phase: PairingPhase;
  value: string;
  onValueChange: (value: string) => void;
  pendingEsl?: string | null;
  isLoading?: boolean;
  statusMessage?: string | null;
  error?: string | null;
  onSubmit: (value: string, method: ScanMethod) => void;
  onManual: () => void;
  onBackFromManual: () => void;
  onBack: () => void;
}

export function VinScanStep({
  phase,
  value,
  onValueChange,
  pendingEsl,
  isLoading,
  statusMessage,
  error,
  onSubmit,
  onManual,
  onBackFromManual,
  onBack,
}: VinScanStepProps) {
  if (phase === "manual") {
    return (
      <div className="flex flex-col px-5 pb-8 pt-2">
        <button type="button" onClick={onBackFromManual} className="mb-4 text-sm font-medium text-primary">
          ← Use camera
        </button>
        <h2 className="text-[17px] font-semibold">Enter VIN</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type the 17-character VIN from the windshield or door jamb.
        </p>

        <div className="mt-6">
          <ManualEntryInput
            label="VIN"
            placeholder="e.g. 1HGBH41JXMN109186"
            value={value}
            onValueChange={onValueChange}
            isLoading={isLoading}
            statusMessage={statusMessage}
            onSubmit={onSubmit}
          />
        </div>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Lookup failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-5 py-2">
        <button type="button" onClick={onBack} className="text-sm font-medium text-primary">
          ← Home
        </button>
      </div>

      {pendingEsl ? (
        <div className="mx-5 mb-2 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm">
          Tag <span className="font-mono font-semibold">{pendingEsl}</span> ready — scan the VIN.
        </div>
      ) : null}

      <CameraScanner
        target="vin"
        stepLabel="Step 1 of 2 · Vehicle"
        hint="Point at the VIN barcode"
        subhint="Windshield or driver door jamb"
        manualLabel="Enter manually"
        isLoading={isLoading}
        onScan={onSubmit}
        onManual={onManual}
      />

      {error ? (
        <Alert variant="destructive" className="mx-5 mt-4">
          <AlertTitle>Lookup failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
