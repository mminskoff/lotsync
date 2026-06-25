"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { listInventorySources } from "@/lib/inventorySourcesApi";
import { useDealership } from "@/providers/DealershipProvider";

interface InventorySnapshotCardProps {
  vehicleCount: number;
}

export function InventorySnapshotCard({ vehicleCount }: InventorySnapshotCardProps) {
  const { dealershipId, dealershipIds } = useDealership();
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [sourceCount, setSourceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids =
      dealershipIds.length > 0 ? dealershipIds : dealershipId ? [dealershipId] : [];

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void Promise.all(ids.map((id) => listInventorySources({ dealershipId: id })))
      .then((batches) => {
        if (cancelled) {
          return;
        }
        const sources = batches.flat();
        setSourceCount(sources.length);
        const timestamps = sources
          .map((source) => source.last_success_at)
          .filter((value): value is string => Boolean(value));
        if (timestamps.length === 0) {
          setLastSyncAt(null);
          return;
        }
        setLastSyncAt(
          timestamps.sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime(),
          )[0] ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSourceCount(0);
          setLastSyncAt(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dealershipId, dealershipIds]);

  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Inventory</h2>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{vehicleCount}</p>
          <p className="text-sm text-muted-foreground">vehicles on this rooftop</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/inventory-sources">Manage</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {loading
          ? "Loading sync status…"
          : lastSyncAt
            ? `Last sync ${formatDateTime(lastSyncAt)}`
            : sourceCount > 0
              ? "No successful sync yet"
              : "No inventory feeds configured"}
      </p>
    </div>
  );
}
