import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatVehicleTitle } from "@/lib/format";
import type { VehiclePairingSummary } from "@/lib/types/pairing";

export function VehicleSummaryCard({
  vehicle,
}: {
  vehicle: VehiclePairingSummary;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Vehicle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-lg font-semibold">{formatVehicleTitle(vehicle)}</p>
        <p className="font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
        <div className="flex flex-wrap gap-2">
          {vehicle.stock_number ? (
            <Badge variant="secondary">Stock {vehicle.stock_number}</Badge>
          ) : null}
          <Badge variant="outline">{formatPrice(vehicle.displayed_price)}</Badge>
          {vehicle.sync_status ? (
            <Badge variant="outline">{vehicle.sync_status}</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
