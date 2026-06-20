import { cn } from "@/lib/utils";
import type { PairingStep } from "@/hooks/usePairingFlow";

const STEPS = [
  { key: "vin", label: "VIN" },
  { key: "esl", label: "ESL" },
  { key: "confirm", label: "Confirm" },
  { key: "success", label: "Done" },
] as const;

function stepIndex(step: PairingStep): number {
  switch (step) {
    case "vin":
      return 0;
    case "esl":
      return 1;
    case "confirm":
    case "submitting":
      return 2;
    case "success":
      return 3;
    default:
      return 0;
  }
}

export function PairingStepper({ step }: { step: PairingStep }) {
  const active = stepIndex(step);

  return (
    <nav aria-label="Pairing progress" className="mb-5 px-4 pt-1">
      <ol className="flex gap-2">
        {STEPS.map((item, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <li key={item.key} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className={cn(
                  "h-1 rounded-full transition-colors",
                  done || current ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "truncate text-center text-[10px] font-semibold uppercase tracking-wider",
                  current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
