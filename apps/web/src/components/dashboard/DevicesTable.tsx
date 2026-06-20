"use client";

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
import type { ESLDevice } from "@/lib/types/esl-device";
import type { AssignmentSummary } from "@/lib/types/pairing";

function pairingForDevice(
  deviceId: string,
  pairings: AssignmentSummary[],
): AssignmentSummary | undefined {
  return pairings.find((p) => p.device.id === deviceId);
}

export function DevicesTable({
  devices,
  pairings,
}: {
  devices: ESLDevice[];
  pairings: AssignmentSummary[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tag ID</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Paired vehicle</TableHead>
            <TableHead>Battery</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Last seen</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const pairing = pairingForDevice(device.id, pairings);
            return (
              <TableRow key={device.id}>
                <TableCell className="font-mono font-medium">{device.device_id}</TableCell>
                <TableCell>{device.model ?? "—"}</TableCell>
                <TableCell>
                  {pairing ? (
                    formatVehicleLabel(
                      pairing.vehicle.year,
                      pairing.vehicle.make,
                      pairing.vehicle.model,
                    )
                  ) : (
                    <span className="text-muted-foreground">Available</span>
                  )}
                </TableCell>
                <TableCell>
                  {device.battery_level != null ? `${device.battery_level}%` : "—"}
                </TableCell>
                <TableCell>{device.signal_status ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {device.last_seen_at ? formatDateTime(device.last_seen_at) : "—"}
                </TableCell>
                <TableCell>
                  <SyncStatusBadge status={device.status ?? "available"} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
