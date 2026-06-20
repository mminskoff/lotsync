"use client";

import { ArrowRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";
import { VehicleHeroCard } from "@/components/pairing/VehicleHeroCard";
import type { VehicleLookupResponse } from "@/lib/types/pairing";

interface VinDetailStepProps {
  vehicleLookup: VehicleLookupResponse;
  isLoading?: boolean;
  onContinue: () => void;
  onRescan: () => void;
}

export function VinDetailStep({
  vehicleLookup,
  isLoading,
  onContinue,
  onRescan,
}: VinDetailStepProps) {
  const { vehicle, active_assignment, warnings } = vehicleLookup;

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-2">
        <h2 className="text-[17px] font-semibold">Vehicle found</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <VehicleHeroCard vehicle={vehicle} className="mt-3" />

        {active_assignment ? (
          <Alert className="mt-4 border-[#f0dca8] bg-[var(--status-pending-bg)]">
            <AlertTitle className="text-[var(--status-pending)]">Already paired</AlertTitle>
            <AlertDescription>
              This vehicle has an active tag. You can reassign on the confirm step.
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
          Scan ESL tag
          <ArrowRight className="size-[18px]" strokeWidth={2.2} />
        </Button>
        <Button type="button" size="lg" variant="ghost" className="w-full" disabled={isLoading} onClick={onRescan}>
          Not this vehicle
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
