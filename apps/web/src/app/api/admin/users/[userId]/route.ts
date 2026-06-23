import { NextRequest, NextResponse } from "next/server";

import { deleteDealershipUser, requireUserManager } from "@/lib/admin/users";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const auth = await requireUserManager();
  if ("error" in auth) {
    return auth.error;
  }

  const { userId } = await context.params;
  const dealershipId = request.nextUrl.searchParams.get("dealershipId")?.trim();

  if (!userId) {
    return NextResponse.json({ detail: "userId is required" }, { status: 400 });
  }
  if (!dealershipId) {
    return NextResponse.json({ detail: "dealershipId is required" }, { status: 400 });
  }

  if (auth.user.id === userId) {
    return NextResponse.json({ detail: "You cannot delete your own account" }, { status: 400 });
  }

  try {
    await deleteDealershipUser({ userId, dealershipId, actorRole: auth.role });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete user";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
