"use client";

import Link from "next/link";

import { DashboardVehicleTable } from "@/components/dashboard/DashboardVehicleTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardMismatchesPage() {
  const { vehicles, isLoading, error } = useDashboard();

  const mismatches = vehicles.filter(
    (v) => v.sync_status?.toUpperCase() === "PRICE_MISMATCH",
  );

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load mismatches</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Price Mismatches"
        description="Vehicles where inventory source and consumer-facing price disagree."
      />
      {mismatches.length === 0 ? (
        <Alert>
          <AlertTitle>No mismatches</AlertTitle>
          <AlertDescription>
            Nothing flagged yet. Mismatches appear when feed verification detects a conflict
            (M7/M8).{" "}
            <Link href="/dashboard/vehicles" className="font-medium text-primary underline">
              View all vehicles
            </Link>
          </AlertDescription>
        </Alert>
      ) : (
        <DashboardVehicleTable vehicles={mismatches} />
      )}
    </>
  );
}
