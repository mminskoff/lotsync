"use client";

import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RooftopRouteGuard } from "@/components/dashboard/RooftopRouteGuard";
import { DashboardDataProvider } from "@/providers/DashboardDataProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <DashboardDataProvider>
        <RooftopRouteGuard />
        <DashboardShell>{children}</DashboardShell>
      </DashboardDataProvider>
    </RequireAuth>
  );
}
