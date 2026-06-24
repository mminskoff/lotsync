"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/dashboard";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function waitForSession(timeoutMs = 4000): Promise<boolean> {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        return true;
      }

      return new Promise((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), timeoutMs);
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession) {
            window.clearTimeout(timeout);
            subscription.unsubscribe();
            resolve(true);
          }
        });
      });
    }

    async function run() {
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        } else if (tokenHash && type) {
          const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "invite" | "signup" | "recovery" | "email",
          });
          if (otpError) {
            throw otpError;
          }
        } else if (window.location.hash.includes("access_token")) {
          // Implicit flow — browser client reads tokens from the URL hash.
          const ok = await waitForSession();
          if (!ok) {
            throw new Error("Invite link expired or invalid. Ask for a new invite.");
          }
        } else {
          throw new Error("Missing auth credentials in invite link.");
        }

        const hasSession = await waitForSession(1000);
        if (!hasSession) {
          throw new Error("Could not start your session. Ask for a new invite.");
        }

        router.replace(safeNext);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not complete sign-in");
      }
    }

    void run();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app-bg px-6">
        <LogoMark size="md" />
        <p className="mt-4 max-w-sm text-center text-sm text-destructive">{error}</p>
        <Button className="mt-6" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-app-bg">
      <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-app-bg">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
