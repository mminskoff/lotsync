"use client";

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
  const src = `/api/label-preview/${vehicleId}?dealershipId=${encodeURIComponent(dealershipId)}&t=${vehicleId}`;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tag preview
      </p>
      <div className="inline-block rounded-lg border border-border bg-white p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full"
          width={400}
          height={300}
          loading="lazy"
        />
      </div>
    </div>
  );
}
