"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listInventorySources,
  syncInventorySourceNow,
  type InventorySource,
} from "@/lib/inventorySourcesApi";
import { formatDateTime } from "@/lib/format";
import { useDealership } from "@/providers/DealershipProvider";

export default function InventorySourcesPage() {
  const { dealershipId } = useDealership();
  const [sources, setSources] = useState<InventorySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!dealershipId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await listInventorySources({ dealershipId });
      setSources(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory sources");
    } finally {
      setLoading(false);
    }
  }, [dealershipId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync(source: InventorySource) {
    setSyncingId(source.id);
    try {
      const result = await syncInventorySourceNow(source.id, { dealershipId });
      if (result.success) {
        toast.success(
          `${source.name}: ${result.vehicles_imported} vehicles (${result.vehicles_created} new, ${result.vehicles_updated} updated)`,
        );
      } else {
        toast.error(result.error ?? "Sync failed");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Inventory Sources"
        description="Feeds that pull vehicle data into LotSync. Sync runs update prices and flag mismatches."
      />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Could not load sources</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sources.length === 0 ? (
        <Alert>
          <AlertTitle>No inventory sources</AlertTitle>
          <AlertDescription>
            This rooftop has no feeds configured yet. Nielsen Excel sources are set up via{" "}
            <code className="text-xs">setup_nielsen_rooftops.py</code>.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last sync</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">{source.name}</TableCell>
                  <TableCell className="text-muted-foreground">{source.source_type}</TableCell>
                  <TableCell>
                    {source.enabled ? (
                      source.last_error ? (
                        <Badge variant="failed">Error</Badge>
                      ) : (
                        <Badge variant="synced">Enabled</Badge>
                      )
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {source.last_success_at
                      ? formatDateTime(source.last_success_at)
                      : "Never"}
                    {source.last_error ? (
                      <p className="mt-1 text-xs text-destructive">{source.last_error}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!source.enabled || syncingId === source.id}
                      onClick={() => void handleSync(source)}
                    >
                      {syncingId === source.id ? "Syncing…" : "Sync now"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
