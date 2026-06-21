"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAccessibleDealerships } from "@/lib/dealershipsApi";
import type { RooftopGroup } from "@/lib/types/dealership";
import type { RooftopScope } from "@/lib/dealership-storage";
import { useDealership } from "@/providers/DealershipProvider";

export interface DealershipSwitcherState {
  groups: RooftopGroup[];
  activeGroup: RooftopGroup | null;
  primaryTitle: string;
  subtitle: string;
  isLoading: boolean;
  error: string | null;
  rooftopScope: RooftopScope;
  activeDealershipId: string;
  selectAllRooftops: (group: RooftopGroup) => void;
  selectDealership: (group: RooftopGroup, dealershipId: string) => void;
  reload: () => void;
}

function groupKey(group: RooftopGroup): string {
  return group.organization_id ?? `solo:${group.dealerships[0]?.id ?? "unknown"}`;
}

export function useDealershipSwitcher(): DealershipSwitcherState {
  const {
    dealershipId,
    rooftopScope,
    organizationId,
    setRooftopSelection,
  } = useDealership();
  const [groups, setGroups] = useState<RooftopGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!dealershipId) {
      setGroups([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listAccessibleDealerships(dealershipId);
        if (!cancelled) {
          setGroups(response.groups);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load rooftops");
          setGroups([]);
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
  }, [dealershipId, tick]);

  const activeGroup = useMemo(() => {
    if (groups.length === 0) {
      return null;
    }
    if (organizationId) {
      const match = groups.find((group) => group.organization_id === organizationId);
      if (match) {
        return match;
      }
    }
    return (
      groups.find((group) => group.dealerships.some((dealer) => dealer.id === dealershipId)) ??
      groups[0] ??
      null
    );
  }, [groups, organizationId, dealershipId]);

  const currentDealership = useMemo(() => {
    if (!activeGroup) {
      return null;
    }
    return activeGroup.dealerships.find((dealer) => dealer.id === dealershipId) ?? null;
  }, [activeGroup, dealershipId]);

  const primaryTitle = activeGroup?.organization_name ?? currentDealership?.name ?? "Dealership";

  const subtitle = useMemo(() => {
    if (error) {
      return "API offline — start port 8000";
    }
    if (!activeGroup) {
      return "Loading rooftops…";
    }
    const count = activeGroup.dealerships.length;
    if (rooftopScope === "all" && count > 1) {
      return `${count} rooftops · All`;
    }
    if (rooftopScope === "all") {
      return "All rooftops";
    }
    if (count > 1) {
      return currentDealership?.name ?? `${count} rooftops`;
    }
    return "Single rooftop";
  }, [activeGroup, currentDealership, error, rooftopScope]);

  const selectAllRooftops = useCallback(
    (group: RooftopGroup) => {
      const ids = group.dealerships.map((dealer) => dealer.id);
      const anchorId = ids.includes(dealershipId)
        ? dealershipId
        : (ids[0] ?? dealershipId);
      setRooftopSelection({
        organizationId: group.organization_id,
        scope: "all",
        dealershipId: anchorId,
        dealershipIds: ids,
      });
    },
    [dealershipId, setRooftopSelection],
  );

  const selectDealership = useCallback(
    (group: RooftopGroup, nextDealershipId: string) => {
      setRooftopSelection({
        organizationId: group.organization_id,
        scope: "single",
        dealershipId: nextDealershipId,
        dealershipIds: [nextDealershipId],
      });
    },
    [setRooftopSelection],
  );

  return {
    groups,
    activeGroup,
    primaryTitle,
    subtitle,
    isLoading,
    error,
    rooftopScope,
    activeDealershipId: dealershipId,
    selectAllRooftops,
    selectDealership,
    reload: () => setTick((n) => n + 1),
  };
}

export { groupKey };
