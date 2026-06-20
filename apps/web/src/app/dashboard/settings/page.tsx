"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DevDealershipIdControl } from "@/components/layout/DevDealershipIdControl";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Dealership configuration and dev controls until Supabase Auth is wired."
      />
      <div className="mx-auto max-w-lg space-y-6">
        {session ? (
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">{session.displayName}</p>
            <p className="text-sm text-muted-foreground">{session.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{roleLabel(session.role)}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => {
                signOut();
                router.replace("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        ) : null}

        <DevDealershipIdControl />

        <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Inventory sources</p>
          <p className="mt-1">
            Reynolds &amp; Reynolds and other DMS adapters arrive in Milestone 7. Connect feeds
            here once adapters are live.
          </p>
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/pairing">Open lot pairing app</Link>
        </Button>
      </div>
    </>
  );
}
