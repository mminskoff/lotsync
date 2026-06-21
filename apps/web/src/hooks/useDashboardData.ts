"use client";

import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/api";
import { listEslDevices } from "@/lib/eslDevicesApi";
import { listActivePairings } from "@/lib/pairingApi";
import { listSyncEvents } from "@/lib/syncEventsApi";
import { listAuditLogs } from "@/lib/auditApi";
import { listVehicles } from "@/lib/vehiclesApi";
import type { AuditLogEntry } from "@/lib/types/audit";
import type { ESLDevice } from "@/lib/types/esl-device";
import type { AssignmentSummary } from "@/lib/types/pairing";
import type { SyncEvent } from "@/lib/types/sync-event";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";
import { useDealership } from "@/providers/DealershipProvider";

export interface DashboardOverview {
  totalVehicles: number;
  taggedCount: number;
  pendingSyncs: number;
  failedSyncs: number;
  pendingEvents: number;
  coveragePct: number;
  devicesOnline: number;
  totalDevices: number;
}

export interface DashboardData {
  vehicles: VehicleWithAssignment[];
  pairings: AssignmentSummary[];
  devices: ESLDevice[];
  syncEvents: SyncEvent[];
  auditLogs: AuditLogEntry[];
  overview: DashboardOverview;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

function buildOverview(
  vehicles: VehicleWithAssignment[],
  devices: ESLDevice[],
  syncEvents: SyncEvent[],
): DashboardOverview {
  const taggedCount = vehicles.filter((v) => v.assigned_esl).length;
  const pendingSyncs = vehicles.filter(
    (v) => v.sync_status?.toUpperCase() === "PENDING",
  ).length;
  const failedSyncs = vehicles.filter(
    (v) => v.sync_status?.toUpperCase() === "FAILED",
  ).length;
  const pendingEvents = syncEvents.filter(
    (e) => e.status.toUpperCase() === "PENDING",
  ).length;

  return {
    totalVehicles: vehicles.length,
    taggedCount,
    pendingSyncs,
    failedSyncs,
    pendingEvents,
    coveragePct:
      vehicles.length > 0 ? Math.round((taggedCount / vehicles.length) * 1000) / 10 : 0,
    devicesOnline: devices.filter((d) => d.status?.toLowerCase() !== "offline").length,
    totalDevices: devices.length,
  };
}

export function useDashboardData(): DashboardData {
  const { dealershipId, dealershipIds, rooftopScope } = useDealership();
  const [vehicles, setVehicles] = useState<VehicleWithAssignment[]>([]);
  const [pairings, setPairings] = useState<AssignmentSummary[]>([]);
  const [devices, setDevices] = useState<ESLDevice[]>([]);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const loadIds =
      dealershipIds.length > 0 ? dealershipIds : dealershipId ? [dealershipId] : [];

    if (loadIds.length === 0) {
      setIsLoading(false);
      setError("Set a dealership ID in Settings to load dashboard data.");
      return;
    }

    let cancelled = false;

    async function loadForDealership(id: string) {
      const [vehicleRows, pairingsRes, deviceRows, events, logs] = await Promise.all([
        listVehicles({ dealershipId: id }),
        listActivePairings({ dealershipId: id }),
        listEslDevices(id),
        listSyncEvents({ dealershipId: id }),
        listAuditLogs({ dealershipId: id }),
      ]);
      return { vehicleRows, pairingsRes, deviceRows, events, logs };
    }

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const batches = await Promise.all(loadIds.map((id) => loadForDealership(id)));

        const vehicleRows = batches.flatMap((batch) => batch.vehicleRows);
        const pairings = batches.flatMap((batch) => batch.pairingsRes.pairings);
        const deviceRows = batches.flatMap((batch) => batch.deviceRows);
        const events = batches.flatMap((batch) => batch.events);
        const logs = batches.flatMap((batch) => batch.logs);

        const assignmentByVehicle = new Map(
          pairings.map((pairing) => [
            pairing.vehicle.id,
            {
              deviceCode: pairing.device.device_id,
              assignmentId: pairing.id,
            },
          ]),
        );

        const merged: VehicleWithAssignment[] = vehicleRows.map((vehicle) => {
          const assignment = assignmentByVehicle.get(vehicle.id);
          return {
            ...vehicle,
            assigned_esl: assignment?.deviceCode ?? null,
            assignment_id: assignment?.assignmentId ?? null,
          };
        });

        if (!cancelled) {
          setVehicles(merged);
          setPairings(pairings);
          setDevices(deviceRows);
          setSyncEvents(events);
          setAuditLogs(logs);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [dealershipId, dealershipIds, rooftopScope, tick]);

  const overview = useMemo(
    () => buildOverview(vehicles, devices, syncEvents),
    [vehicles, devices, syncEvents],
  );

  return {
    vehicles,
    pairings,
    devices,
    syncEvents,
    auditLogs,
    overview,
    isLoading,
    error,
    reload: () => setTick((n) => n + 1),
  };
}
