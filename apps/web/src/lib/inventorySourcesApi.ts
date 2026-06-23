import { apiFetch } from "@/lib/api";

export interface InventorySource {
  id: string;
  dealership_id: string;
  source_type: string;
  name: string;
  config_json: Record<string, unknown>;
  enabled: boolean;
  last_sync_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export interface InventorySyncResult {
  success: boolean;
  vehicles_imported: number;
  vehicles_created: number;
  vehicles_updated: number;
  vehicles_off_lot: number;
  sync_run_id: string;
  error: string | null;
}

export function listInventorySources(options?: {
  dealershipId?: string;
}): Promise<InventorySource[]> {
  return apiFetch("/inventory-sources", { dealershipId: options?.dealershipId });
}

export function syncInventorySourceNow(
  sourceId: string,
  options?: { dealershipId?: string },
): Promise<InventorySyncResult> {
  return apiFetch(`/inventory-sources/${sourceId}/sync-now`, {
    method: "POST",
    dealershipId: options?.dealershipId,
  });
}
