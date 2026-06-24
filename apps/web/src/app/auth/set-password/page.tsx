"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/brand/LogoMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
        setReady(true);
        return;
      }

      const gotSession = await new Promise<boolean>((resolve) => {
        const timeout = window.setTimeout(() => resolve(false), 4000);
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (nextSession?.user?.email) {
            setEmail(nextSession.user.email);
            setReady(true);
            window.clearTimeout(timeout);
            subscription.unsubscribe();
            resolve(true);
          }
        });
      });

      if (!gotSession) {
        router.replace("/login?error=Invite+session+expired.+Use+a+fresh+invite+link.");
      }
    }

    void loadSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.app_metadata?.role ?? user?.user_metadata?.role ?? "lot_staff";
      router.replace(role === "lot_staff" ? "/pairing" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set password");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app-bg">
        <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <LogoMark size="md" />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set your password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {email ? `Create a password for ${email}` : "Choose a password for your LotSync account."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full font-semibold" disabled={submitting}>
              {submitting ? "Saving…" : "Save password & continue"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Use this same password at /login next time you sign in.
          </p>
        </div>
      </div>
    </div>
  );
}
