"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { LabelPreview } from "@/components/dashboard/LabelPreview";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatPrice, formatVehicleLabel } from "@/lib/format";
import { listActivePairings } from "@/lib/pairingApi";
import { listSyncEvents } from "@/lib/syncEventsApi";
import type { AssignmentSummary } from "@/lib/types/pairing";
import type { SyncEvent } from "@/lib/types/sync-event";
import type { Vehicle } from "@/lib/types/vehicle";
import { getVehicle } from "@/lib/vehiclesApi";
import { useDealership } from "@/providers/DealershipProvider";

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { dealershipId } = useDealership();
  const apiDealershipId = searchParams.get("dealershipId") ?? dealershipId;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [pairing, setPairing] = useState<AssignmentSummary | null>(null);
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiDealershipId || !params.id) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [v, pairingsRes, syncRows] = await Promise.all([
          getVehicle(params.id, { dealershipId: apiDealershipId }),
          listActivePairings({ dealershipId: apiDealershipId }),
          listSyncEvents({ dealershipId: apiDealershipId, vehicleId: params.id }),
        ]);

        if (cancelled) return;
        setVehicle(v);
        setPairing(
          pairingsRes.pairings.find((p) => p.vehicle.id === params.id) ?? null,
        );
        setEvents(syncRows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load vehicle");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiDealershipId, params.id]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error || !vehicle) {
    return (
      <>
        <Alert variant="destructive">
          <AlertTitle>Vehicle not found</AlertTitle>
          <AlertDescription>
            {error ??
              "This vehicle is not in the currently selected rooftop. It may have moved after an inventory refresh."}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/vehicles">← Back to vehicles</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model)}
        description={vehicle.vin}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/vehicles">← All vehicles</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-4 font-semibold">Vehicle info</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Stock</dt>
              <dd className="font-mono">{vehicle.stock_number ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd>{vehicle.status ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sync</dt>
              <dd>
                <SyncStatusBadge status={vehicle.sync_status} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Updated</dt>
              <dd>{formatDateTime(vehicle.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <h2 className="mb-4 font-semibold">Pricing</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Displayed</dt>
              <dd className="text-lg font-semibold">{formatPrice(vehicle.displayed_price)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Source</dt>
              <dd>{formatPrice(vehicle.source_price)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Website verified</dt>
              <dd>{formatPrice(vehicle.website_verified_price)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Assigned ESL</h2>
          {pairing ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Tag</dt>
                <dd className="font-mono font-medium">{pairing.device.device_id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paired</dt>
                <dd>{formatDateTime(pairing.assigned_at)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Source</dt>
                <dd>{pairing.assignment_source}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No active tag assignment.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <LabelPreview vehicleId={vehicle.id} dealershipId={apiDealershipId} />
        </section>

        <section className="rounded-2xl border border-border bg-background p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Sync history</h2>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync events for this vehicle yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span>{event.event_type}</span>
                  <div className="flex items-center gap-3">
                    <SyncStatusBadge status={event.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
