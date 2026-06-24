"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { clearLegacySession, type LotSession } from "@/lib/auth-storage";
import { createClient } from "@/lib/supabase/client";
import { sessionFromUser } from "@/lib/supabase/session";

interface AuthContextValue {
  session: LotSession | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<LotSession>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<LotSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    clearLegacySession();
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      setSessionState(initial?.user ? sessionFromUser(initial.user) : null);
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSessionState(nextSession?.user ? sessionFromUser(nextSession.user) : null);
      setIsReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    if (!password.trim()) {
      throw new Error("Password is required.");
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        throw new Error(
          "Invalid email or password. If you were invited, open the invite email, set your password, then sign in with that password.",
        );
      }
      throw new Error(error.message);
    }
    if (!data.user) {
      throw new Error("Sign in failed — no user returned.");
    }

    const next = sessionFromUser(data.user);
    setSessionState(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSessionState(null);
  }, []);

  const value = useMemo(
    () => ({ session, isReady, signIn, signOut }),
    [session, isReady, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
