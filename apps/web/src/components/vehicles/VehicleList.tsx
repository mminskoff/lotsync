"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { listActivePairings } from "@/lib/pairingApi";
import { listVehicles } from "@/lib/vehiclesApi";
import { ApiError } from "@/lib/api";
import type { VehicleWithAssignment } from "@/lib/types/vehicle";
import { useDealership } from "@/providers/DealershipProvider";

function matchesQuery(vehicle: VehicleWithAssignment, query: string): boolean {
  const haystack = [
    vehicle.vin,
    vehicle.stock_number,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
    vehicle.assigned_esl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function VehicleList() {
  const { dealershipId, dealershipIds, rooftopScope } = useDealership();
  const [vehicles, setVehicles] = useState<VehicleWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const ids =
      dealershipIds.length > 0 ? dealershipIds : dealershipId ? [dealershipId] : [];

    if (ids.length === 0) {
      setVehicles([]);
      setIsLoading(false);
      setError("Select a rooftop in Settings to load vehicles.");
      return;
    }

    let cancelled = false;

    async function loadForDealership(id: string) {
      const [vehicleRows, pairings] = await Promise.all([
        listVehicles({ dealershipId: id }),
        listActivePairings({ dealershipId: id }),
      ]);
      return { vehicleRows, pairings };
    }

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const batches = await Promise.all(ids.map((id) => loadForDealership(id)));
        const vehicleRows = batches.flatMap((batch) => batch.vehicleRows);
        const pairings = batches.flatMap((batch) => batch.pairings.pairings);

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
  }, [dealershipId, dealershipIds, rooftopScope]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredVehicles = useMemo(() => {
    if (!normalizedQuery) {
      return vehicles;
    }
    return vehicles.filter((vehicle) => matchesQuery(vehicle, normalizedQuery));
  }, [vehicles, normalizedQuery]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
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

  return (
    <>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search VIN, stock #, make, model, or tag…"
          className="h-12 rounded-xl bg-background pl-10"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {vehicles.length === 0 ? (
        <Alert>
          <AlertTitle>No vehicles</AlertTitle>
          <AlertDescription>No inventory found for this rooftop.</AlertDescription>
        </Alert>
      ) : filteredVehicles.length === 0 ? (
        <Alert>
          <AlertTitle>No matches</AlertTitle>
          <AlertDescription>Try a different VIN, stock number, or tag code.</AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {filteredVehicles.length} of {vehicles.length} vehicles
          </p>
          <div className="grid gap-3 md:hidden">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
          <div className="hidden md:block">
            <VehicleTable vehicles={filteredVehicles} />
          </div>
        </>
      )}
    </>
  );
}
