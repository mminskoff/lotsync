import { apiFetch } from "@/lib/api";
import type { AuditLogEntry } from "@/lib/types/audit";

export function listAuditLogs(options?: { dealershipId?: string }): Promise<AuditLogEntry[]> {
  return apiFetch("/audit-logs", { dealershipId: options?.dealershipId });
}
