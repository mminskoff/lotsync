"use client";

import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FlowFooterSpacer, FlowStickyFooter } from "@/components/pairing/FlowStickyFooter";
import { VehicleHeroCard } from "@/components/pairing/VehicleHeroCard";
import { formatVehicleTitle } from "@/lib/format";
import type {
  DeviceLookupResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";

interface ReassignWarningStepProps {
  vehicleLookup: VehicleLookupResponse;
  deviceLookup: DeviceLookupResponse;
  isLoading?: boolean;
  onConfirm: () => void;
  onScanDifferent: () => void;
}

export function ReassignWarningStep({
  vehicleLookup,
  deviceLookup,
  isLoading,
  onConfirm,
  onScanDifferent,
}: ReassignWarningStepProps) {
  const assignedVehicle = deviceLookup.active_assignment?.vehicle;
  const newTitle = formatVehicleTitle(vehicleLookup.vehicle);
  const oldTitle = assignedVehicle ? formatVehicleTitle(assignedVehicle) : "another vehicle";

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <h2 className="text-[17px] font-semibold">Tag already in use</h2>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--status-pending-bg)] text-[var(--status-pending)]">
          <AlertTriangle className="size-7" strokeWidth={2} />
        </div>
        <p className="text-sm text-neutral-600">
          <span className="font-mono font-semibold text-foreground">
            {deviceLookup.device.device_id}
          </span>{" "}
          is currently paired to another vehicle.
        </p>
      </div>

      {assignedVehicle ? (
        <div className="mt-4 rounded-2xl border border-[#f0dca8] bg-[var(--status-pending-bg)] p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--status-pending)]">
            Currently paired
          </p>
          <p className="mt-0.5 font-semibold">{oldTitle}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {assignedVehicle.vin}
            {assignedVehicle.stock_number ? ` · Stock ${assignedVehicle.stock_number}` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <VehicleHeroCard vehicle={vehicleLookup.vehicle} variant="compact" />
      </div>

      <Alert className="mt-4 border-[#f0dca8] bg-[var(--status-pending-bg)]">
        <AlertTitle className="text-[13px] text-[var(--status-pending)]">
          Reassigning unpairs {oldTitle}
        </AlertTitle>
        <AlertDescription className="text-sm text-neutral-600">
          {newTitle} will get this tag. The previous vehicle shows no price until tagged again.
        </AlertDescription>
      </Alert>

      <FlowFooterSpacer />
      <FlowStickyFooter variant="white">
        <Button
          type="button"
          size="lg"
          variant="destructive"
          className="w-full bg-[var(--status-failed)] font-semibold hover:brightness-95"
          disabled={isLoading}
          onClick={onConfirm}
        >
          {isLoading ? "Reassigning…" : `Reassign to ${newTitle.split(" ").slice(-1)[0] ?? "vehicle"}`}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="w-full"
          disabled={isLoading}
          onClick={onScanDifferent}
        >
          Scan a different tag
        </Button>
      </FlowStickyFooter>
    </div>
  );
}
