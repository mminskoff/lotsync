const DEALERSHIP_KEY = "lotsync_dealership_id";
const SCOPE_KEY = "lotsync_rooftop_scope";
const ORG_KEY = "lotsync_organization_id";
const CUSTOM_KEY = "lotsync_dealership_custom";

export type RooftopScope = "all" | "single";

/** Dealership id saved in localStorage only (empty if never saved). */
export function getStoredDealershipId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DEALERSHIP_KEY);
    if (stored) {
      return stored.trim();
    }
  }
  return "";
}

export function hasCustomDealershipSelection(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if (localStorage.getItem(CUSTOM_KEY) === "1") {
    return true;
  }
  const stored = getStoredDealershipId();
  const env = getDefaultDealershipId();
  return Boolean(stored && env && stored !== env);
}

export function getDealershipId(): string {
  const stored = getStoredDealershipId();
  if (stored) {
    return stored;
  }
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}

export function setDealershipId(id: string, options?: { custom?: boolean }): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEALERSHIP_KEY, id.trim());
    if (options?.custom !== false) {
      localStorage.setItem(CUSTOM_KEY, "1");
    }
  }
}

export function getRooftopScope(): RooftopScope {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(SCOPE_KEY);
    if (stored === "all" || stored === "single") {
      return stored;
    }
  }
  return "single";
}

export function setRooftopScope(scope: RooftopScope): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SCOPE_KEY, scope);
    localStorage.setItem(CUSTOM_KEY, "1");
  }
}

export function getOrganizationId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(ORG_KEY) ?? "";
  }
  return "";
}

export function setOrganizationId(id: string): void {
  if (typeof window !== "undefined") {
    if (id) {
      localStorage.setItem(ORG_KEY, id.trim());
    } else {
      localStorage.removeItem(ORG_KEY);
    }
    localStorage.setItem(CUSTOM_KEY, "1");
  }
}

export function getDefaultDealershipId(): string {
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}
