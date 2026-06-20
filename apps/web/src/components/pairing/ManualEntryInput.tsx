"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScanMethod } from "@/hooks/usePairingFlow";
import { useId, useRef, useState } from "react";

interface ManualEntryInputProps {
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  isLoading?: boolean;
  statusMessage?: string | null;
  onSubmit: (value: string, method: ScanMethod) => void;
}

export function ManualEntryInput({
  label,
  placeholder,
  value,
  onValueChange,
  isLoading,
  statusMessage,
  onSubmit,
}: ManualEntryInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const lastSubmitAt = useRef(0);

  function readFieldValue(): string {
    const fromDom = inputRef.current?.value ?? "";
    return (fromDom || value).trim();
  }

  function submitValue() {
    const now = Date.now();
    if (isLoading || now - lastSubmitAt.current < 400) {
      return;
    }
    lastSubmitAt.current = now;

    const resolved = readFieldValue();

    if (!resolved) {
      setLocalStatus("Enter a value to continue.");
      return;
    }

    setLocalStatus(`Looking up ${resolved}…`);
    onSubmit(resolved, "manual");
  }

  function handleActivate(event: React.SyntheticEvent) {
    event.preventDefault();
    event.stopPropagation();
    submitValue();
  }

  const displayStatus = statusMessage ?? localStatus;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
          {label}
        </Label>
        <Input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(event) => {
            setLocalStatus(null);
            onValueChange(event.target.value);
          }}
          onInput={(event) => {
            setLocalStatus(null);
            onValueChange(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitValue();
            }
          }}
          placeholder={placeholder}
          className="h-14 rounded-xl border-border bg-muted/30 font-mono text-lg font-medium tracking-wide"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          inputMode="text"
          autoFocus
        />
      </div>

      {displayStatus ? (
        <p role="status" className="text-sm text-muted-foreground">
          {displayStatus}
        </p>
      ) : null}

      <button
        type="button"
        disabled={isLoading}
        onMouseDown={handleActivate}
        onTouchEnd={handleActivate}
        onClick={handleActivate}
        className="inline-flex h-12 w-full shrink-0 touch-manipulation select-none items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground shadow-sm active:bg-[var(--primary-hover)] disabled:opacity-50"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {isLoading ? "Looking up…" : "Continue"}
      </button>
    </div>
  );
}
