import { NextRequest, NextResponse } from "next/server";

import type { LotRole } from "@/lib/auth-storage";
import {
  createDealershipUser,
  listDealershipUsers,
  requireUserManager,
} from "@/lib/admin/users";

const VALID_ROLES = new Set<LotRole>(["owner", "manager", "lot_staff"]);

export async function GET(request: NextRequest) {
  const auth = await requireUserManager();
  if ("error" in auth) {
    return auth.error;
  }

  const dealershipId = request.nextUrl.searchParams.get("dealershipId")?.trim();
  if (!dealershipId) {
    return NextResponse.json({ detail: "dealershipId is required" }, { status: 400 });
  }

  try {
    const users = await listDealershipUsers(dealershipId);
    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUserManager();
  if ("error" in auth) {
    return auth.error;
  }

  let body: {
    email?: string;
    password?: string;
    role?: string;
    dealershipId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role as LotRole;
  const dealershipId = body.dealershipId?.trim() ?? "";

  if (!email.includes("@")) {
    return NextResponse.json({ detail: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { detail: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ detail: "Invalid role" }, { status: 400 });
  }
  if (!dealershipId) {
    return NextResponse.json({ detail: "dealershipId is required" }, { status: 400 });
  }

  // Managers cannot create owners
  if (auth.role === "manager" && role === "owner") {
    return NextResponse.json(
      { detail: "Managers cannot create owner accounts" },
      { status: 403 },
    );
  }

  try {
    const user = await createDealershipUser({ email, password, role, dealershipId });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create user";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
