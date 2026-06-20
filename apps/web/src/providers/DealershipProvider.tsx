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
  getDealershipId,
  getDefaultDealershipId,
  setDealershipId,
} from "@/lib/dealership-storage";

interface DealershipContextValue {
  dealershipId: string;
  setDealershipIdValue: (id: string) => void;
}

const DealershipContext = createContext<DealershipContextValue | null>(null);

export function DealershipProvider({ children }: { children: React.ReactNode }) {
  const [dealershipId, setId] = useState(() => {
    if (typeof window === "undefined") {
      return getDefaultDealershipId();
    }
    return getDealershipId() || getDefaultDealershipId();
  });

  useEffect(() => {
    const fromEnv = getDefaultDealershipId();
    const stored = getDealershipId();
    const resolved = stored || fromEnv;
    if (!stored && fromEnv) {
      setDealershipId(fromEnv);
    }
    setId(resolved);
  }, []);

  const setDealershipIdValue = useCallback((id: string) => {
    setDealershipId(id);
    setId(id.trim());
  }, []);

  const value = useMemo(
    () => ({ dealershipId, setDealershipIdValue }),
    [dealershipId, setDealershipIdValue],
  );

  return (
    <DealershipContext.Provider value={value}>{children}</DealershipContext.Provider>
  );
}

export function useDealership(): DealershipContextValue {
  const context = useContext(DealershipContext);
  if (!context) {
    throw new Error("useDealership must be used within DealershipProvider");
  }
  return context;
}
