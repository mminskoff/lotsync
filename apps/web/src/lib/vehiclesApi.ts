import { apiFetch } from "@/lib/api";
import type { Vehicle } from "@/lib/types/vehicle";

export function listVehicles(): Promise<Vehicle[]> {
  return apiFetch("/vehicles");
}

export function getVehicle(vehicleId: string): Promise<Vehicle> {
  return apiFetch(`/vehicles/${encodeURIComponent(vehicleId)}`);
}
