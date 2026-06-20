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
import { formatDateTime } from "@/lib/format";
import type { SyncEvent } from "@/lib/types/sync-event";

export function SyncEventsTable({ events }: { events: SyncEvent[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-mono text-xs">{event.id.slice(0, 8)}…</TableCell>
              <TableCell>{event.event_type}</TableCell>
              <TableCell>
                <SyncStatusBadge status={event.status} />
                {event.error_message ? (
                  <p className="mt-1 text-xs text-destructive">{event.error_message}</p>
                ) : null}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(event.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
