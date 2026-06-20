import { apiFetch } from "@/lib/api";
import type {
  ActivePairingsResponse,
  DeviceLookupResponse,
  PairingCreateBody,
  PairingReassignBody,
  PairingResponse,
  PushLabelResponse,
  UnpairResponse,
  VehicleLookupResponse,
} from "@/lib/types/pairing";

type ApiContext = {
  dealershipId?: string;
};

export function lookupVehicleByVin(
  vin: string,
  ctx: ApiContext = {},
): Promise<VehicleLookupResponse> {
  return apiFetch(
    `/mobile/vehicles/by-vin/${encodeURIComponent(vin.trim().toUpperCase())}`,
    { dealershipId: ctx.dealershipId },
  );
}

export function lookupDeviceByCode(
  deviceCode: string,
  ctx: ApiContext = {},
): Promise<DeviceLookupResponse> {
  return apiFetch(
    `/mobile/esl-devices/by-code/${encodeURIComponent(deviceCode.trim())}`,
    { dealershipId: ctx.dealershipId },
  );
}

export function createPairing(
  body: PairingCreateBody,
  ctx: ApiContext = {},
): Promise<PairingResponse> {
  return apiFetch("/pairings", {
    method: "POST",
    dealershipId: ctx.dealershipId,
    body: {
      assignment_source: "web_pwa",
      force_reassign: false,
      ...body,
    },
  });
}

export function reassignPairing(
  body: PairingReassignBody,
  ctx: ApiContext = {},
): Promise<PairingResponse> {
  return apiFetch("/pairings/reassign", {
    method: "POST",
    dealershipId: ctx.dealershipId,
    body: {
      assignment_source: "web_pwa",
      force_reassign: true,
      ...body,
    },
  });
}

export function unpairAssignment(
  assignmentId: string,
  ctx: ApiContext = {},
): Promise<UnpairResponse> {
  return apiFetch(`/pairings/${assignmentId}`, {
    method: "DELETE",
    dealershipId: ctx.dealershipId,
  });
}

export function pushLabel(
  vehicleId: string,
  ctx: ApiContext = {},
): Promise<PushLabelResponse> {
  return apiFetch(`/vehicles/${vehicleId}/push-label`, {
    method: "POST",
    dealershipId: ctx.dealershipId,
  });
}

export function listActivePairings(
  ctx: ApiContext = {},
): Promise<ActivePairingsResponse> {
  return apiFetch("/pairings/active", { dealershipId: ctx.dealershipId });
}
