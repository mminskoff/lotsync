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
import { formatDateTime, formatVehicleLabel } from "@/lib/format";
import type { AssignmentSummary } from "@/lib/types/pairing";

export function AssignmentsTable({ pairings }: { pairings: AssignmentSummary[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>ESL tag</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Scan</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairings.map((pairing) => (
            <TableRow key={pairing.id}>
              <TableCell>
                <Link
                  href={`/dashboard/vehicles/${pairing.vehicle.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {formatVehicleLabel(
                    pairing.vehicle.year,
                    pairing.vehicle.make,
                    pairing.vehicle.model,
                  )}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">{pairing.vehicle.vin}</p>
              </TableCell>
              <TableCell className="font-mono font-medium">{pairing.device.device_id}</TableCell>
              <TableCell className="text-sm">{pairing.assignment_source}</TableCell>
              <TableCell className="text-sm">{pairing.scan_type ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(pairing.assigned_at)}
              </TableCell>
              <TableCell>
                <SyncStatusBadge status={pairing.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
