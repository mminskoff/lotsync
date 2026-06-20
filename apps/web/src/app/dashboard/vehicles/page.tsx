"use client";

import { useMemo, useState } from "react";

import { DashboardVehicleTable } from "@/components/dashboard/DashboardVehicleTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardVehiclesPage() {
  const { vehicles, isLoading, error } = useDashboard();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.vin.toLowerCase().includes(q) ||
        v.stock_number?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.assigned_esl?.toLowerCase().includes(q),
    );
  }, [vehicles, query]);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load vehicles</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Every unit on the lot and its label status."
      />
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="Search vehicles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <Alert>
          <AlertTitle>No vehicles</AlertTitle>
          <AlertDescription>
            {query ? "No matches for your search." : "No inventory loaded for this dealership."}
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <DashboardVehicleTable vehicles={filtered} />
          <p className="mt-3 text-sm text-muted-foreground">
            Showing {filtered.length} of {vehicles.length} vehicles
          </p>
        </>
      )}
    </>
  );
}
