"use client";

import { createContext, useContext } from "react";

import { useDashboardData, type DashboardData } from "@/hooks/useDashboardData";

const DashboardDataContext = createContext<DashboardData | null>(null);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const data = useDashboardData();
  return (
    <DashboardDataContext.Provider value={data}>{children}</DashboardDataContext.Provider>
  );
}

export function useDashboard(): DashboardData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardDataProvider");
  }
  return ctx;
}
