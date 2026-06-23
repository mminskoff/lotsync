import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { LotRole } from "@/lib/auth-storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MANAGE_USER_ROLES = new Set<LotRole>(["owner", "manager"]);

export interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function roleFromUser(user: User): LotRole {
  const raw = user.app_metadata?.role ?? user.user_metadata?.role;
  if (raw === "owner" || raw === "manager" || raw === "lot_staff") {
    return raw;
  }
  return "lot_staff";
}

export async function requireUserManager() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ detail: "Sign in required" }, { status: 401 }),
    };
  }

  const role = roleFromUser(user);
  if (!MANAGE_USER_ROLES.has(role)) {
    return {
      error: NextResponse.json(
        { detail: "Only owners and managers can manage users" },
        { status: 403 },
      ),
    };
  }

  return { user, role };
}

export async function listDealershipUsers(dealershipId: string): Promise<AdminUserRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, role, created_at")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminUserRow[];
}

export async function createDealershipUser(input: {
  email: string;
  password: string;
  role: LotRole;
  dealershipId: string;
}): Promise<AdminUserRow> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    app_metadata: {
      role: input.role,
      dealership_id: input.dealershipId,
    },
  });

  if (createError) {
    throw new Error(createError.message);
  }
  if (!created.user) {
    throw new Error("User creation failed");
  }

  const { data: row, error: insertError } = await admin
    .from("users")
    .upsert(
      {
        id: created.user.id,
        dealership_id: input.dealershipId,
        email,
        role: input.role,
      },
      { onConflict: "dealership_id,email" },
    )
    .select("id, email, role, created_at")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return row as AdminUserRow;
}

export async function deleteDealershipUser(input: {
  userId: string;
  dealershipId: string;
  actorRole: LotRole;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: row, error: fetchError } = await admin
    .from("users")
    .select("id, email, role, dealership_id")
    .eq("id", input.userId)
    .eq("dealership_id", input.dealershipId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }
  if (!row) {
    throw new Error("User not found for this rooftop");
  }

  if (input.actorRole === "manager" && row.role === "owner") {
    throw new Error("Managers cannot delete owner accounts");
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(input.userId);
  if (authDeleteError) {
    throw new Error(authDeleteError.message);
  }

  const { error: dbDeleteError } = await admin
    .from("users")
    .delete()
    .eq("id", input.userId)
    .eq("dealership_id", input.dealershipId);

  if (dbDeleteError) {
    throw new Error(dbDeleteError.message);
  }
}

function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  const vercel = process.env.VERCEL_URL;
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export async function inviteDealershipUser(input: {
  email: string;
  role: LotRole;
  dealershipId: string;
}): Promise<AdminUserRow> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  const redirectTo = `${appUrl()}/auth/callback?next=${encodeURIComponent("/auth/set-password")}`;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { redirectTo },
  );

  if (inviteError) {
    throw new Error(inviteError.message);
  }
  if (!invited.user) {
    throw new Error("Invite failed");
  }

  const { error: metaError } = await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: {
      role: input.role,
      dealership_id: input.dealershipId,
    },
  });

  if (metaError) {
    throw new Error(metaError.message);
  }

  const { data: row, error: insertError } = await admin
    .from("users")
    .upsert(
      {
        id: invited.user.id,
        dealership_id: input.dealershipId,
        email,
        role: input.role,
      },
      { onConflict: "dealership_id,email" },
    )
    .select("id, email, role, created_at")
    .single();

  if (insertError) {
    throw new Error(insertError.message);
  }

  return row as AdminUserRow;
}
