import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ESLDevicePairingSummary } from "@/lib/types/pairing";

export function DeviceSummaryCard({
  device,
  assignmentLabel,
  isAvailable,
  className,
}: {
  device: ESLDevicePairingSummary;
  assignmentLabel?: string | null;
  isAvailable?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            ESL tag
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight">
            {device.device_id}
          </p>
        </div>
        {isAvailable === true ? (
          <Badge variant="synced">Available</Badge>
        ) : null}
        {isAvailable === false ? (
          <Badge variant="pending">Assigned</Badge>
        ) : null}
      </div>

      <div className="space-y-2 px-4 py-3 text-sm">
        {assignmentLabel ? (
          <p className="text-muted-foreground">
            Currently paired to{" "}
            <span className="font-medium text-foreground">{assignmentLabel}</span>
          </p>
        ) : isAvailable === true ? (
          <p className="text-muted-foreground">This tag is not currently assigned.</p>
        ) : isAvailable === false ? null : (
          <p className="text-muted-foreground">No active assignment on file.</p>
        )}

        {(device.battery_level != null || device.signal_status) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {device.signal_status ? (
              <Badge variant="outline">{device.signal_status}</Badge>
            ) : null}
            {device.battery_level != null ? (
              <Badge variant="outline">Battery {device.battery_level}%</Badge>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
