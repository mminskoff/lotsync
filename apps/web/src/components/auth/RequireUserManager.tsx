"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { LotRole } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

const MANAGE_USER_ROLES = new Set<LotRole>(["owner", "manager"]);

export function canManageUsers(role: LotRole | undefined): boolean {
  return role !== undefined && MANAGE_USER_ROLES.has(role);
}

export function RequireUserManager({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!session || !canManageUsers(session.role)) {
      router.replace("/dashboard");
    }
  }, [isReady, session, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!session || !canManageUsers(session.role)) {
    return null;
  }

  return children;
}
