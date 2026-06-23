import { NextRequest, NextResponse } from "next/server";

import type { LotRole } from "@/lib/auth-storage";
import { inviteDealershipUser, requireUserManager } from "@/lib/admin/users";

const VALID_ROLES = new Set<LotRole>(["owner", "manager", "lot_staff"]);

export async function POST(request: NextRequest) {
  const auth = await requireUserManager();
  if ("error" in auth) {
    return auth.error;
  }

  let body: {
    email?: string;
    role?: string;
    dealershipId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role as LotRole;
  const dealershipId = body.dealershipId?.trim() ?? "";

  if (!email.includes("@")) {
    return NextResponse.json({ detail: "Valid email is required" }, { status: 400 });
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ detail: "Invalid role" }, { status: 400 });
  }
  if (!dealershipId) {
    return NextResponse.json({ detail: "dealershipId is required" }, { status: 400 });
  }

  if (auth.role === "manager" && role === "owner") {
    return NextResponse.json(
      { detail: "Managers cannot invite owner accounts" },
      { status: 403 },
    );
  }

  try {
    const user = await inviteDealershipUser({ email, role, dealershipId });
    return NextResponse.json({ user, invited: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send invite";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
