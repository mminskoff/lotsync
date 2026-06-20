import { apiFetch } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/types/audit";

export function listAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch("/audit-logs");
}
