import { cn } from "@/lib/utils";

export function LogoMark({ className, size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 rounded-lg bg-primary shadow-sm",
        size === "sm" ? "size-7" : "size-[30px] rounded-[9px]",
        className,
      )}
      aria-hidden
    >
      <span className="absolute top-[9px] right-1.5 left-1.5 h-1 rounded-sm bg-white/95" />
      <span className="absolute top-[17px] left-1.5 h-1 w-[11px] rounded-sm bg-white/60" />
    </span>
  );
}
