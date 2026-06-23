"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DevDealershipIdControl } from "@/components/layout/DevDealershipIdControl";
import { DataPageLayout } from "@/components/layout/DataPageLayout";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/auth-storage";
import { useAuth } from "@/providers/AuthProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { session, signOut } = useAuth();

  return (
    <DataPageLayout description="Account and dealership settings.">
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
        <Button variant="outline" className="h-12 w-full" asChild>
          <Link href="/pairing">Back to pairing</Link>
        </Button>
      </div>
    </DataPageLayout>
  );
}
