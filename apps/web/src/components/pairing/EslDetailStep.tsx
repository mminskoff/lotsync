"use client";

import { ArrowRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DeviceSummaryCard } from "@/components/pairing/DeviceSummaryCard";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";
import type {
  DeviceLookupResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";
import { formatVehicleTitle } from "@/lib/format";

interface EslDetailStepProps {
  vehicleLookup: VehicleLookupResponse;
  deviceLookup: DeviceLookupResponse;
  isLoading?: boolean;
  onContinue: () => void;
  onRescan: () => void;
  onBack: () => void;
}

export function EslDetailStep({
  vehicleLookup,
  deviceLookup,
  isLoading,
  onContinue,
  onRescan,
  onBack,
}: EslDetailStepProps) {
  const assigned = deviceLookup.active_assignment;
  const { warnings } = deviceLookup;

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2">
        <button type="button" onClick={onBack} className="mb-2 text-sm font-medium text-primary">
          ← Back
        </button>
        <h2 className="text-[17px] font-semibold">Tag found</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4 pt-3">
        <DeviceSummaryCard
          device={deviceLookup.device}
          isAvailable={!assigned}
          assignmentLabel={
            assigned
              ? `${formatVehicleTitle(assigned.vehicle)}${assigned.vehicle.stock_number ? ` · Stock ${assigned.vehicle.stock_number}` : ""}`
              : null
          }
        />

        {assigned ? (
          <Alert className="mt-4 border-[#f0dca8] bg-[var(--status-pending-bg)]">
            <AlertTitle className="text-[var(--status-pending)]">Tag in use</AlertTitle>
            <AlertDescription>
              This tag is paired to another vehicle. You can reassign on the next step.
            </AlertDescription>
          </Alert>
        ) : null}

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
      </div>

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button
          type="button"
          size="lg"
          className="w-full font-semibold"
          disabled={isLoading}
          onClick={onContinue}
        >
          Continue
          <ArrowRight className="size-[18px]" strokeWidth={2.2} />
        </Button>
        <Button type="button" size="lg" variant="ghost" className="w-full" disabled={isLoading} onClick={onRescan}>
          Scan different tag
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
