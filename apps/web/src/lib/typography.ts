import { cn } from "@/lib/utils";

/** Geist Mono + tabular nums — use on VIN, stock #, ESL IDs, prices in data rows */
export function dataMono(className?: string) {
  return cn("font-mono tracking-tight", className);
}
