import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function syncStatusVariant(status: string | null | undefined): BadgeVariant {
  if (!status) return "outline";
  switch (status.toUpperCase()) {
    case "SYNCED":
      return "synced";
    case "PENDING":
    case "UPDATING":
      return "pending";
    case "FAILED":
    case "GATEWAY_OFFLINE":
      return "failed";
    case "PRICE_MISMATCH":
    case "SOURCE_UNVERIFIED":
      return "pending";
    case "OFFLINE":
    case "STALE":
      return "offline";
    default:
      return "outline";
  }
}

export function SyncStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <Badge variant={syncStatusVariant(status)}>{status}</Badge>;
}
