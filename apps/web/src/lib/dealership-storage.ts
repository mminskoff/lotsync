const DEALERSHIP_KEY = "lotsync_dealership_id";
const SCOPE_KEY = "lotsync_rooftop_scope";
const ORG_KEY = "lotsync_organization_id";

export type RooftopScope = "all" | "single";

export function getDealershipId(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(DEALERSHIP_KEY);
    if (stored) {
      return stored;
    }
  }
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}

export function setDealershipId(id: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEALERSHIP_KEY, id.trim());
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
  }
}

export function getDefaultDealershipId(): string {
  return process.env.NEXT_PUBLIC_DEALERSHIP_ID ?? "";
}
