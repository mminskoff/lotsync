"use client";

import { useMemo, useState } from "react";

import { DashboardAuditTable } from "@/components/dashboard/DashboardAuditTable";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/providers/DashboardDataProvider";

export default function DashboardAuditPage() {
  const { auditLogs, isLoading, error } = useDashboard();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        JSON.stringify(log.metadata).toLowerCase().includes(q),
    );
  }, [auditLogs, query]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load audit log</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Immutable record of every change for compliance and dispute resolution."
      />
      <div className="mb-4 max-w-sm">
        <Input placeholder="Search log…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <DashboardAuditTable logs={filtered} />
    </>
  );
}
