import { Car } from "lucide-react";

import { formatVehicleTitle } from "@/lib/format";
import type { VehiclePairingSummary } from "@/lib/types/pairing";

export function VehicleContextPill({ vehicle }: { vehicle: VehiclePairingSummary }) {
  const title = formatVehicleTitle(vehicle);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Car className="size-5 text-primary" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
      </div>
    </div>
  );
}
