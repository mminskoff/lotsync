import { cn } from "@/lib/utils";

interface FlowStepHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function FlowStepHeader({ title, subtitle, className }: FlowStepHeaderProps) {
  return (
    <header className={cn("space-y-1", className)}>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
