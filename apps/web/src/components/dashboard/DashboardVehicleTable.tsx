"use client";

import Link from "next/link";

import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatPrice, formatVehicleLabel } from "@/lib/format";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";

export function DashboardVehicleTable({ vehicles }: { vehicles: VehicleWithAssignment[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>ESL tag</TableHead>
            <TableHead>Sync</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <Link
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model)}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
              <TableCell>{vehicle.stock_number ?? "—"}</TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(vehicle.displayed_price)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {vehicle.assigned_esl ?? (
                  <span className="font-sans text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <SyncStatusBadge status={vehicle.sync_status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDateTime(vehicle.updated_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
