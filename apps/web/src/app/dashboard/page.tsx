"use client";

import Link from "next/link";

import { InventorySnapshotCard } from "@/components/dashboard/InventorySnapshotCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SyncStatusBadge } from "@/components/dashboard/SyncStatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatVehicleLabel } from "@/lib/format";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardHomePage() {
  const { overview, vehicles, auditLogs, isLoading, error } = useDashboard();

  const needsAttention = vehicles.filter((v) => {
    const s = v.sync_status?.toUpperCase();
    return s === "PENDING" || s === "FAILED" || s === "PRICE_MISMATCH";
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Dashboard unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live picture of inventory, labels, and sync health."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/sync-events">View sync events</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vehicles tagged"
          value={overview.taggedCount}
          hint={`${overview.coveragePct}% of ${overview.totalVehicles} in inventory`}
        />
        <StatCard
          label="Pending syncs"
          value={overview.pendingSyncs + overview.pendingEvents}
          hint="Vehicles and events awaiting push"
        />
        <StatCard label="Failed syncs" value={overview.failedSyncs} hint="Needs attention" />
        <StatCard
          label="ESL devices"
          value={overview.totalDevices}
          hint={`${overview.totalDevices} registered · ${overview.devicesOnline} reporting online`}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Label coverage</h2>
            <span className="text-2xl font-semibold text-primary">{overview.coveragePct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${overview.coveragePct}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>{overview.taggedCount} tagged</span>
            <span>{overview.totalVehicles - overview.taggedCount} untagged</span>
          </div>
        </div>

        <InventorySnapshotCard vehicleCount={overview.totalVehicles} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Needs attention</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/sync-events">View all →</Link>
            </Button>
          </div>
          {needsAttention.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">All vehicles look healthy.</p>
          ) : (
            <ul className="divide-y divide-border">
              {needsAttention.slice(0, 5).map((vehicle) => (
                <li key={vehicle.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}?dealershipId=${vehicle.dealership_id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {formatVehicleLabel(vehicle.year, vehicle.make, vehicle.model)}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
                  </div>
                  <SyncStatusBadge status={vehicle.sync_status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent activity</h2>
          </div>
          <ul className="divide-y divide-border">
            {auditLogs.slice(0, 6).map((log) => (
              <li key={log.id} className="px-5 py-3">
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(log.created_at)} · {log.entity_type}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
