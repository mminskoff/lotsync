import { Check, Link2 } from "lucide-react";

import { formatPrice, formatVehicleTitle } from "@/lib/format";
import type {
  DeviceLookupResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";

export function PairConnectVisual({
  vehicleLookup,
  deviceLookup,
}: {
  vehicleLookup: VehicleLookupResponse;
  deviceLookup: DeviceLookupResponse;
}) {
  const vehicle = vehicleLookup.vehicle;
  const device = deviceLookup.device;
  const title = formatVehicleTitle(vehicle);
  const price = formatPrice(vehicle.displayed_price);

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4H5z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Vehicle
          </p>
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {vehicle.vin} · {price}
          </p>
        </div>
      </div>

      <div className="relative h-9 w-0.5 bg-green-300">
        <div className="absolute top-1/2 left-1/2 flex size-[30px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_0_4px_var(--app-bg)]">
          <Link2 className="size-4" strokeWidth={2.4} />
        </div>
      </div>

      <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12V4h8l9 9-7 7-9-9z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            ESL tag
          </p>
          <p className="truncate font-mono font-semibold">{device.device_id}</p>
          {device.battery_level != null ? (
            <p className="font-mono text-xs text-muted-foreground">
              Battery {device.battery_level}%
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-1">
        {["Price & promotions", "Inventory status", "Vehicle details"].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2.5 border-b border-neutral-100 py-2.5 text-[13px] last:border-0"
          >
            <Check className="size-4 text-green-600" strokeWidth={2.4} />
            {item}
          </div>
        ))}
      </div>

      <p className="mt-3.5 text-center text-xs text-muted-foreground">
        Updates push to this tag automatically from now on.
      </p>
    </div>
  );
}
