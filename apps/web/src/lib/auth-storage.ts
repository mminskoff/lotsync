const SESSION_KEY = "lotsync_session";

export type LotRole = "owner" | "manager" | "lot_staff";

export interface LotSession {
  email: string;
  displayName: string;
  role: LotRole;
  signedInAt: string;
}

export function getSession(): LotSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as LotSession;
  } catch {
    return null;
  }
}

export function setSession(session: LotSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) {
    return "there";
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Dev placeholder — real Supabase Auth comes later. */
export function signInPlaceholder(
  email: string,
  _password: string,
  role: LotRole,
): LotSession {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  if (!_password.trim()) {
    throw new Error("Password is required.");
  }

  const session: LotSession = {
    email: trimmed,
    displayName: displayNameFromEmail(trimmed),
    role,
    signedInAt: new Date().toISOString(),
  };
  setSession(session);
  return session;
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
