import type { User } from "@supabase/supabase-js";

import {
  displayNameFromEmail,
  type LotRole,
  type LotSession,
} from "@/lib/auth-storage";

const LOT_ROLES: LotRole[] = ["owner", "manager", "lot_staff"];

function parseRole(value: unknown): LotRole {
  if (typeof value === "string" && LOT_ROLES.includes(value as LotRole)) {
    return value as LotRole;
  }
  return "lot_staff";
}

export function sessionFromUser(user: User): LotSession {
  const email = user.email?.trim().toLowerCase() ?? "";
  const role = parseRole(user.app_metadata?.role ?? user.user_metadata?.role);

  return {
    email,
    displayName: displayNameFromEmail(email),
    role,
    signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}
