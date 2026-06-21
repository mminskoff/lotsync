import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-background p-5 shadow-sm", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums leading-none tracking-normal">{value}</p>
      {hint ? (
        <p className="mt-2 text-sm leading-snug tracking-normal text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
