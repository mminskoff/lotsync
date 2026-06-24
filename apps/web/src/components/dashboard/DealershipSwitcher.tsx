"use client";

import { RooftopSwitcher } from "@/components/dealership/RooftopSwitcher";

export function DealershipSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  return <RooftopSwitcher variant="sidebar" collapsed={collapsed} />;
}
