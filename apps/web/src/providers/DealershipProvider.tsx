"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDealershipId,
  getDefaultDealershipId,
  getOrganizationId,
  getRooftopScope,
  getStoredDealershipId,
  setDealershipId,
  setOrganizationId,
  setRooftopScope,
  type RooftopScope,
} from "@/lib/dealership-storage";
import { listAccessibleDealerships } from "@/lib/dealershipsApi";

export interface RooftopSelection {
  organizationId: string | null;
  scope: RooftopScope;
  dealershipId: string;
  dealershipIds: string[];
}

interface DealershipContextValue {
  dealershipId: string;
  rooftopScope: RooftopScope;
  organizationId: string | null;
  dealershipIds: string[];
  setRooftopSelection: (selection: RooftopSelection) => void;
}

const DealershipContext = createContext<DealershipContextValue | null>(null);

export function DealershipProvider({ children }: { children: React.ReactNode }) {
  const [dealershipId, setId] = useState(() => {
    if (typeof window === "undefined") {
      return getDefaultDealershipId();
    }
    return getDealershipId() || getDefaultDealershipId();
  });
  const [rooftopScope, setScope] = useState<RooftopScope>(() =>
    typeof window === "undefined" ? "single" : getRooftopScope(),
  );
  const [organizationId, setOrgId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getOrganizationId() || null,
  );
  const [dealershipIds, setDealershipIds] = useState<string[]>(() => {
    const id = typeof window === "undefined" ? getDefaultDealershipId() : getDealershipId();
    return id ? [id] : [];
  });

  useEffect(() => {
    const fromEnv = getDefaultDealershipId();
    const stored = getStoredDealershipId();
    const resolved = stored || fromEnv;
    const scope = getRooftopScope();
    const orgId = getOrganizationId() || null;

    if (!stored && fromEnv) {
      setDealershipId(fromEnv, { custom: false });
    }
    setId(resolved);
    setScope(scope);
    setOrgId(orgId);

    if (!resolved) {
      return;
    }

    if (scope === "single") {
      setDealershipIds([resolved]);
      return;
    }

    let cancelled = false;

    void listAccessibleDealerships(resolved)
      .then((response) => {
        if (cancelled) {
          return;
        }
        const group =
          (orgId
            ? response.groups.find((item) => item.organization_id === orgId)
            : null) ??
          response.groups.find((item) =>
            item.dealerships.some((dealer) => dealer.id === resolved),
          );
        if (group) {
          setDealershipIds(group.dealerships.map((dealer) => dealer.id));
        } else {
          setDealershipIds([resolved]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDealershipIds([resolved]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setRooftopSelection = useCallback((selection: RooftopSelection) => {
    setDealershipId(selection.dealershipId);
    setRooftopScope(selection.scope);
    setOrganizationId(selection.organizationId ?? "");
    setId(selection.dealershipId);
    setScope(selection.scope);
    setOrgId(selection.organizationId);
    setDealershipIds(selection.dealershipIds);
  }, []);

  const value = useMemo(
    () => ({
      dealershipId,
      rooftopScope,
      organizationId,
      dealershipIds,
      setRooftopSelection,
    }),
    [dealershipId, rooftopScope, organizationId, dealershipIds, setRooftopSelection],
  );

  return (
    <DealershipContext.Provider value={value}>{children}</DealershipContext.Provider>
  );
}

export function useDealership(): DealershipContextValue {
  const context = useContext(DealershipContext);
  if (!context) {
    throw new Error("useDealership must be used within DealershipProvider");
  }
  return context;
}
