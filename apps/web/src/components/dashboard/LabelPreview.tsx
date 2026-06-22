"use client";

import { EslLabelCard } from "@/components/dashboard/EslLabelCard";
import type { LabelVehicle } from "@/lib/label-format";

interface LabelPreviewProps {
  vehicle: LabelVehicle;
  bw?: boolean;
  className?: string;
}

export function LabelPreview({ vehicle, bw = false, className }: LabelPreviewProps) {
  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tag preview
      </p>
      <EslLabelCard vehicle={vehicle} bw={bw} />
    </div>
  );
}
