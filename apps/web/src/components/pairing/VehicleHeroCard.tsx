import { Car } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dataMono } from "@/lib/typography";
import { formatPrice, formatVehicleTitle } from "@/lib/format";
import type { VehiclePairingSummary } from "@/lib/types/pairing";

interface VehicleHeroCardProps {
  vehicle: VehiclePairingSummary;
  imageUrl?: string | null;
  variant?: "hero" | "compact";
  className?: string;
}

function SpecRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-[11px] last:border-0">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className={cn("text-[13px] font-medium", mono && dataMono())}>{value}</span>
    </div>
  );
}

export function VehicleHeroCard({
  vehicle,
  imageUrl,
  variant = "hero",
  className,
}: VehicleHeroCardProps) {
  const title = formatVehicleTitle(vehicle);
  const photo = imageUrl ?? vehicle.image_url ?? null;
  const price = formatPrice(vehicle.displayed_price);

  if (variant === "compact") {
    return (
      <article className={cn("rounded-2xl border border-border bg-background p-3.5", className)}>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Vehicle</p>
        <p className="mt-0.5 font-semibold">{title}</p>
        <p className="font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
        {vehicle.stock_number ? (
          <p className="text-xs text-muted-foreground">Stock {vehicle.stock_number}</p>
        ) : null}
        <p className="mt-1 font-semibold">{price}</p>
      </article>
    );
  }

  return (
    <article className={cn("overflow-hidden", className)}>
      <div className="relative mb-4 h-[150px] overflow-hidden rounded-[18px] border border-dashed border-neutral-300 bg-neutral-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-neutral-400">
            <Car className="size-10 opacity-40" strokeWidth={1.25} />
            <span className="font-mono text-[11px] uppercase tracking-wider">Vehicle photo</span>
          </div>
        )}
        <Badge variant="outline" className="absolute top-3 left-3 bg-background/90">
          Available
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[22px] font-semibold tracking-tight">{title}</h3>
          {vehicle.trim ? (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{vehicle.trim}</p>
          ) : null}
        </div>
      </div>

      {price !== "—" ? (
        <p className="mt-3 text-2xl font-semibold tracking-tight">{price}</p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-1">
        <SpecRow label="VIN" value={vehicle.vin} mono />
        {vehicle.stock_number ? <SpecRow label="Stock" value={vehicle.stock_number} mono /> : null}
        {vehicle.status ? <SpecRow label="Status" value={vehicle.status} /> : null}
      </div>
    </article>
  );
}
