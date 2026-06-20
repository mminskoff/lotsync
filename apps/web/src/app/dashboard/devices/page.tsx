"use client";

import { useMemo, useState } from "react";

import { DevicesTable } from "@/components/dashboard/DevicesTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardDevicesPage() {
  const { devices, pairings, isLoading, error } = useDashboard();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => d.device_id.toLowerCase().includes(q));
  }, [devices, query]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load devices</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="ESL Devices"
        description="Hardware fleet — battery, signal, and pairing per tag."
      />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search tags…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <Alert>
          <AlertTitle>No ESL devices</AlertTitle>
          <AlertDescription>Register tags via the API or dev tools.</AlertDescription>
        </Alert>
      ) : (
        <DevicesTable devices={filtered} pairings={pairings} />
      )}
    </>
  );
}
