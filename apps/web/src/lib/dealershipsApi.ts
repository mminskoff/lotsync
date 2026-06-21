import { apiFetch } from "@/lib/api";
import type { AccessibleDealershipsResponse, Dealership } from "@/lib/types/dealership";

export function getMyDealership(dealershipId?: string): Promise<Dealership> {
  return apiFetch("/dealerships/me", { dealershipId });
}

export function listAccessibleDealerships(
  dealershipId?: string,
): Promise<AccessibleDealershipsResponse> {
  return apiFetch("/dealerships/accessible", { dealershipId });
}
