"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatVehicleLabel } from "@/lib/format";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";

export function VehicleCard({ vehicle }: { vehicle: VehicleWithAssignment }) {
  const title = formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model);

  return (
    <Card className="rounded-2xl border-border shadow-xs">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold leading-snug">{title}</p>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
          </div>
          <p className="shrink-0 font-semibold">{formatPrice(vehicle.displayed_price)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {vehicle.stock_number ? (
            <Badge variant="outline">Stock {vehicle.stock_number}</Badge>
          ) : null}
          {vehicle.assigned_esl ? (
            <Badge variant="synced">{vehicle.assigned_esl}</Badge>
          ) : (
            <Badge variant="offline">Unassigned</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
