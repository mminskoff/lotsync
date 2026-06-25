"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DevDealershipIdControl } from "@/components/layout/DevDealershipIdControl";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RooftopSwitcher } from "@/components/dealership/RooftopSwitcher";
import { canManageUsers } from "@/components/auth/RequireUserManager";
import { Button } from "@/components/ui/button";
import { canUseDevDealershipId, roleLabel } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardSettingsPage() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Dealership configuration and account settings."
      />
      <div className="mx-auto max-w-lg space-y-6">
        {session ? (
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">{session.displayName}</p>
            <p className="text-sm text-muted-foreground">{session.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{roleLabel(session.role)}</p>
            <div className="mt-3">
              <RooftopSwitcher variant="mobile" settingsHref="/dashboard/settings" />
            </div>
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

        {session && canManageUsers(session.role) ? (
          <div className="rounded-2xl border border-border bg-background p-4">
            <p className="text-sm font-semibold">Team</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an email invite — they choose their own password — or create an account manually.
            </p>
            <Button variant="default" className="mt-4 w-full" asChild>
              <Link href="/dashboard/users">Invite team members</Link>
            </Button>
          </div>
        ) : null}

        {session && canUseDevDealershipId(session.role) ? <DevDealershipIdControl /> : null}

        <Button variant="outline" className="w-full" asChild>
          <Link href="/pairing">Open lot pairing app</Link>
        </Button>
      </div>
    </>
  );
}
