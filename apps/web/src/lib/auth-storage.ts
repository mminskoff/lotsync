export type LotRole = "owner" | "manager" | "lot_staff";

export interface LotSession {
  id: string;
  email: string;
  displayName: string;
  role: LotRole;
  signedInAt: string;
}

const LEGACY_SESSION_KEY = "lotsync_session";

/** Remove pre-Supabase localStorage session from older builds. */
export function clearLegacySession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) {
    return "there";
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function roleLabel(role: LotRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "lot_staff":
      return "Lot staff";
  }
}

export function canUseDevDealershipId(role: LotRole | undefined): boolean {
  return role === "owner";
}
