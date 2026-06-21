import { apiFetch } from "@/lib/api";
import type { Vehicle } from "@/lib/types/vehicle";

export function listVehicles(options?: { dealershipId?: string }): Promise<Vehicle[]> {
  return apiFetch("/vehicles", { dealershipId: options?.dealershipId });
}

export function getVehicle(
  vehicleId: string,
  options?: { dealershipId?: string },
): Promise<Vehicle> {
  return apiFetch(`/vehicles/${encodeURIComponent(vehicleId)}`, {
    dealershipId: options?.dealershipId,
  });
}
