"use client";

import { useMemo } from "react";

interface LabelPreviewProps {
  vehicleId: string;
  dealershipId: string;
  alt?: string;
  className?: string;
}

export function LabelPreview({
  vehicleId,
  dealershipId,
  alt = "ESL label preview",
  className,
}: LabelPreviewProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      dealershipId,
          v: "3",
    });
    return `/api/label-preview/${vehicleId}?${params.toString()}`;
  }, [vehicleId, dealershipId]);

  return (
    <div className={className}>
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tag preview
      </p>
      <div className="w-full max-w-xl rounded-xl border border-border bg-white p-3 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
    </div>
  );
}
