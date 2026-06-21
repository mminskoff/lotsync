"use client";

import { useState } from "react";

import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { retrySyncEvent } from "@/lib/syncEventsApi";
import type { SyncEvent } from "@/lib/types/sync-event";

export function SyncEventsTable({
  events,
  onRetried,
}: {
  events: SyncEvent[];
  onRetried?: () => void;
}) {
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function handleRetry(eventId: string) {
    setRetryingId(eventId);
    try {
      await retrySyncEvent(eventId);
      onRetried?.();
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const isFailed = event.status.toUpperCase() === "FAILED";
            return (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-xs">{event.id.slice(0, 8)}…</TableCell>
                <TableCell>{event.event_type}</TableCell>
                <TableCell>
                  <SyncStatusBadge status={event.status} />
                  {event.error_message ? (
                    <p className="mt-1 text-xs text-destructive">{event.error_message}</p>
                  ) : null}
                  {event.attempt_count > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Attempts: {event.attempt_count}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(event.created_at)}
                </TableCell>
                <TableCell>
                  {isFailed ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={retryingId === event.id}
                      onClick={() => handleRetry(event.id)}
                    >
                      {retryingId === event.id ? "…" : "Retry"}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
