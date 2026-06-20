"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types/audit";

export function DashboardAuditTable({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(log.created_at)}
              </TableCell>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell className="text-sm">
                {log.entity_type}
                {log.entity_id ? (
                  <span className="font-mono text-xs text-muted-foreground"> · {log.entity_id.slice(0, 8)}…</span>
                ) : null}
              </TableCell>
              <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                {Object.keys(log.metadata).length > 0
                  ? JSON.stringify(log.metadata)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
