"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";
import { PairConnectVisual } from "@/components/pairing/PairConnectVisual";
import type {
  DeviceLookupResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";

interface ConfirmPairingStepProps {
  vehicleLookup: VehicleLookupResponse;
  deviceLookup: DeviceLookupResponse;
  warnings: string[];
  error?: string | null;
  isLoading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export function ConfirmPairingStep({
  vehicleLookup,
  deviceLookup,
  warnings,
  error,
  isLoading,
  onBack,
  onConfirm,
}: ConfirmPairingStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2">
        <h2 className="text-[17px] font-semibold">Confirm pairing</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4">
        <PairConnectVisual vehicleLookup={vehicleLookup} deviceLookup={deviceLookup} />

        {warnings.length > 0 ? (
          <Alert className="mt-4 border-[#f0dca8] bg-[var(--status-pending-bg)]">
            <AlertTitle className="text-[var(--status-pending)]">Note</AlertTitle>
            <AlertDescription className="space-y-1">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Pairing failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button
          type="button"
          size="lg"
          className="w-full font-semibold"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? "Pairing…" : "Confirm pair"}
        </Button>
        <Button type="button" size="lg" variant="ghost" className="w-full" disabled={isLoading} onClick={onBack}>
          Back
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
