import { apiFetch } from "@/lib/api";
import type { SyncEvent } from "@/lib/types/sync-event";

export function listSyncEvents(options?: {
  status?: string;
  vehicleId?: string;
  dealershipId?: string;
}): Promise<SyncEvent[]> {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.vehicleId) {
    params.set("vehicle_id", options.vehicleId);
  }
  const qs = params.toString();
  return apiFetch(`/sync-events${qs ? `?${qs}` : ""}`, {
    dealershipId: options?.dealershipId,
  });
}

export function retrySyncEvent(
  eventId: string,
  options?: { dealershipId?: string },
): Promise<{ success: boolean; message: string; sync_event: SyncEvent }> {
  return apiFetch(`/sync-events/${eventId}/retry`, {
    method: "POST",
    dealershipId: options?.dealershipId,
  });
}
