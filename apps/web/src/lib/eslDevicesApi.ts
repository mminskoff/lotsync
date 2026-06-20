import { apiFetch } from "@/lib/api";
import type { ESLDevice } from "@/lib/types/esl-device";

export function listEslDevices(dealershipId?: string): Promise<ESLDevice[]> {
  return apiFetch("/esl-devices", { dealershipId });
}

export function getEslDevice(deviceId: string, dealershipId?: string): Promise<ESLDevice> {
  return apiFetch(`/esl-devices/${encodeURIComponent(deviceId)}`, { dealershipId });
}
