import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatVehicleLabel } from "@/lib/format";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";

export function VehicleTable({ vehicles }: { vehicles: VehicleWithAssignment[] }) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Stock #</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Assigned ESL</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>{vehicle.stock_number ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
              <TableCell>
                {formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model)}
              </TableCell>
              <TableCell>{formatPrice(vehicle.displayed_price)}</TableCell>
              <TableCell>
                {vehicle.assigned_esl ? (
                  <Badge>{vehicle.assigned_esl}</Badge>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {vehicle.sync_status ? (
                  <Badge variant="outline">{vehicle.sync_status}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
