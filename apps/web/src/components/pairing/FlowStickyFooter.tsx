import { cn } from "@/lib/utils";

export function FlowStickyFooter({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "white";
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[640px] border-t border-border px-5 py-3 backdrop-blur-md",
        variant === "white" ? "bg-background/95" : "bg-app-bg/90",
        className,
      )}
    >
      <div className="grid gap-2.5">{children}</div>
    </div>
  );
}

export function FlowFooterSpacer() {
  return <div className="h-40 shrink-0" aria-hidden />;
}
