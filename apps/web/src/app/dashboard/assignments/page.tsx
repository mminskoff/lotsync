"use client";

import Link from "next/link";

import { AssignmentsTable } from "@/components/dashboard/AssignmentsTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardAssignmentsPage() {
  const { pairings, isLoading, error } = useDashboard();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load assignments</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Active vehicle ↔ tag bindings on the lot."
        actions={
          <Button size="sm" asChild>
            <Link href="/pairing">Pair in lot app</Link>
          </Button>
        }
      />
      {pairings.length === 0 ? (
        <Alert>
          <AlertTitle>No active pairings</AlertTitle>
          <AlertDescription>Use the lot pairing app to link VINs to tags.</AlertDescription>
        </Alert>
      ) : (
        <AssignmentsTable pairings={pairings} />
      )}
    </>
  );
}
