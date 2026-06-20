"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearSession,
  getSession,
  type LotRole,
  type LotSession,
  signInPlaceholder,
} from "@/lib/auth-storage";

interface AuthContextValue {
  session: LotSession | null;
  isReady: boolean;
  signIn: (email: string, password: string, role: LotRole) => LotSession;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<LotSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSessionState(getSession());
    setIsReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string, role: LotRole) => {
    const next = signInPlaceholder(email, password, role);
    setSessionState(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    clearSession();
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
