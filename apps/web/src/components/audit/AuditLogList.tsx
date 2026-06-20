"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AuditLogCard,
  filterPairingAuditLogs,
} from "@/components/audit/AuditLogCard";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import { listAuditLogs } from "@/lib/auditApi";
import { ApiError } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/types/audit";
import { useDealership } from "@/providers/DealershipProvider";

export function AuditLogList() {
  const { dealershipId } = useDealership();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealershipId) {
      setEntries([]);
      setIsLoading(false);
      setError("Set a Dev Dealership ID in settings to load the audit log.");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const rows = await listAuditLogs();
        if (!cancelled) {
          setEntries(filterPairingAuditLogs(rows));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load audit log");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [dealershipId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load audit log</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (entries.length === 0) {
    return (
      <Alert>
        <AlertTitle>No pairing activity yet</AlertTitle>
        <AlertDescription>
          Pair, reassign, unpair, or sync actions will appear here.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <AuditLogCard key={entry.id} entry={entry} />
        ))}
      </div>
      <div className="hidden md:block">
        <AuditLogTable entries={entries} />
      </div>
    </>
  );
}
