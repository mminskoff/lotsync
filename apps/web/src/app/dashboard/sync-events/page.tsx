"use client";

import { useMemo, useState } from "react";

import { SyncEventsTable } from "@/components/dashboard/SyncEventsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/providers/DashboardDataProvider";

type Filter = "all" | "pending" | "failed";

export default function DashboardSyncEventsPage() {
  const { syncEvents, isLoading, error, reload } = useDashboard();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return syncEvents;
    return syncEvents.filter((e) => e.status.toUpperCase() === filter.toUpperCase());
  }, [syncEvents, filter]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load sync events</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Sync Events"
        description="Stream of label updates and their outcomes."
        actions={
          <Button variant="outline" size="sm" onClick={reload}>
            Refresh
          </Button>
        }
      />

      <div className="mb-4 inline-flex rounded-lg bg-neutral-100 p-1">
        {(["all", "pending", "failed"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Alert>
          <AlertTitle>No sync events</AlertTitle>
          <AlertDescription>
            {filter === "all"
              ? "Pair a vehicle to create the first sync event."
              : `No ${filter} events right now.`}
          </AlertDescription>
        </Alert>
      ) : (
        <SyncEventsTable events={filtered} />
      )}
    </>
  );
}
