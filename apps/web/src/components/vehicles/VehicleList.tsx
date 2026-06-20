"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { listActivePairings } from "@/lib/pairingApi";
import { listVehicles } from "@/lib/vehiclesApi";
import { ApiError } from "@/lib/api";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";
import { useDealership } from "@/providers/DealershipProvider";

export function VehicleList() {
  const { dealershipId } = useDealership();
  const [vehicles, setVehicles] = useState<VehicleWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dealershipId) {
      setVehicles([]);
      setIsLoading(false);
      setError("Set a Dev Dealership ID in settings to load vehicles.");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [vehicleRows, pairings] = await Promise.all([
          listVehicles(),
          listActivePairings(),
        ]);

        const assignmentByVehicle = new Map(
          pairings.pairings.map((pairing) => [
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
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load vehicles");
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
  }, [dealershipId]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load vehicles</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Alert>
        <AlertTitle>No vehicles</AlertTitle>
        <AlertDescription>
          No inventory found for this dealership.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
      <div className="hidden md:block">
        <VehicleTable vehicles={vehicles} />
      </div>
    </>
  );
}
