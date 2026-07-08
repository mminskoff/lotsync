"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ReassignConfirmDialog } from "@/components/pairing/ReassignConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import { listEslDevices } from "@/lib/eslDevicesApi";
import { formatDateTime } from "@/lib/format";
import { createPairing, listActivePairings } from "@/lib/pairingApi";
import type { AssignmentSummary } from "@/lib/types/pairing";
import type { Vehicle } from "@/lib/types/vehicle";

interface VehicleEslAssignmentProps {
  vehicle: Vehicle;
  pairing: AssignmentSummary | null;
  dealershipId: string;
  onPaired: () => void | Promise<void>;
}

export function VehicleEslAssignment({
  vehicle,
  pairing,
  dealershipId,
  onPaired,
}: VehicleEslAssignmentProps) {
  const [deviceCode, setDeviceCode] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [pendingForce, setPendingForce] = useState(false);

  useEffect(() => {
    if (pairing) return;

    let cancelled = false;
    setLoadingTags(true);

    void Promise.all([
      listEslDevices(dealershipId),
      listActivePairings({ dealershipId }),
    ])
      .then(([devices, active]) => {
        if (cancelled) return;
        const pairedIds = new Set(active.pairings.map((row) => row.device.id));
        const unpaired = devices
          .filter((device) => !pairedIds.has(device.id))
          .map((device) => device.device_id)
          .sort();
        setAvailableTags(unpaired);
      })
      .catch(() => {
        if (!cancelled) setAvailableTags([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTags(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dealershipId, pairing]);

  const pairingUrl = useMemo(
    () => `/pairing?vin=${encodeURIComponent(vehicle.vin)}`,
    [vehicle.vin],
  );

  async function submitPairing(forceReassign: boolean) {
    const code = deviceCode.trim();
    if (!code) {
      setError("Enter or select an ESL tag ID.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await createPairing(
        {
          vin: vehicle.vin,
          device_code: code,
          scan_type: "manual",
          force_reassign: forceReassign,
          assignment_source: "web_pwa",
        },
        { dealershipId },
      );

      await onPaired();
      setDeviceCode("");
      setPendingForce(false);
      setReassignOpen(false);
      toast.success(`Paired ${vehicle.vin} to ${result.device.device_id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && !forceReassign) {
        setPendingForce(true);
        setReassignOpen(true);
        return;
      }
      const message =
        err instanceof ApiError ? err.message : "Failed to assign ESL tag";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (pairing) {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Tag</dt>
          <dd className="font-mono font-medium">{pairing.device.device_id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paired</dt>
          <dd>{formatDateTime(pairing.assigned_at)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Source</dt>
          <dd>{pairing.assignment_source}</dd>
        </div>
      </dl>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No active tag assignment. Choose an unpaired ESL tag or enter the ID from the
          physical label.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="esl-select">Unpaired tags</Label>
            <Select
              value={availableTags.includes(deviceCode) ? deviceCode : ""}
              onValueChange={setDeviceCode}
              disabled={loadingTags || submitting}
            >
              <SelectTrigger id="esl-select" className="w-full font-mono">
                <SelectValue
                  placeholder={loadingTags ? "Loading tags…" : "Choose a tag…"}
                />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag} className="font-mono">
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="esl-code">Tag ID</Label>
            <Input
              id="esl-code"
              value={deviceCode}
              onChange={(event) => setDeviceCode(event.target.value)}
              placeholder="e.g. E100000A1525 or DOVERDO-ESL-009"
              className="font-mono"
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => void submitPairing(false)}
            disabled={submitting || !deviceCode.trim()}
          >
            {submitting ? "Assigning…" : "Assign ESL tag"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={pairingUrl}>Pair on lot with camera</Link>
          </Button>
        </div>
      </div>

      <ReassignConfirmDialog
        open={reassignOpen}
        onOpenChange={(open) => {
          setReassignOpen(open);
          if (!open) setPendingForce(false);
        }}
        onConfirm={() => {
          if (pendingForce) void submitPairing(true);
        }}
      />
    </>
  );
}
