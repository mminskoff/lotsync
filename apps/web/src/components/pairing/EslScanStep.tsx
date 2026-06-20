"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CameraScanner } from "@/components/pairing/CameraScanner";
import { ManualEntryInput } from "@/components/pairing/ManualEntryInput";
import type { PairingPhase, ScanMethod } from "@/hooks/usePairingFlow";
import type { VehicleLookupResponse } from "@/lib/types/pairing";

interface EslScanStepProps {
  phase: PairingPhase;
  vehicleLookup: VehicleLookupResponse;
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  statusMessage?: string | null;
  error?: string | null;
  onSubmit: (value: string, method: ScanMethod) => void;
  onManual: () => void;
  onBackFromManual: () => void;
  onBack: () => void;
}

export function EslScanStep({
  phase,
  vehicleLookup,
  value,
  onValueChange,
  isLoading,
  statusMessage,
  error,
  onSubmit,
  onManual,
  onBackFromManual,
  onBack,
}: EslScanStepProps) {
  if (phase === "manual") {
    return (
      <div className="flex flex-col px-5 pb-8 pt-2">
        <button type="button" onClick={onBackFromManual} className="mb-4 text-sm font-medium text-primary">
          ← Use camera
        </button>
        <h2 className="text-[17px] font-semibold">Enter tag ID</h2>
        <p className="mt-1 text-sm text-muted-foreground">Type the code printed on the ESL tag.</p>

        <div className="mt-6">
          <ManualEntryInput
            label="ESL tag code"
            placeholder="e.g. ESL-002"
            value={value}
            onValueChange={onValueChange}
            isLoading={isLoading}
            statusMessage={statusMessage}
            onSubmit={onSubmit}
          />
        </div>

        <Button type="button" variant="ghost" className="mt-2" onClick={onBack}>
          Back to vehicle
        </Button>

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
      <div className="px-5 py-2">
        <button type="button" onClick={onBack} className="text-sm font-medium text-primary">
          ← Back
        </button>
      </div>

      <CameraScanner
        target="esl"
        stepLabel="Step 2 of 2 · Tag"
        hint="Point at the tag on the windshield"
        manualLabel="Enter tag ID"
        vehicle={vehicleLookup.vehicle}
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
