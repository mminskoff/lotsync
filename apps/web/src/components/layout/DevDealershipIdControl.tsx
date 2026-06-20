"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDealership } from "@/providers/DealershipProvider";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface DevDealershipIdControlProps {
  onSaved?: () => void;
}

export function DevDealershipIdControl({ onSaved }: DevDealershipIdControlProps) {
  const { dealershipId, setDealershipIdValue } = useDealership();
  const [draft, setDraft] = useState(dealershipId);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setDraft(dealershipId);
  }, [dealershipId]);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("Dev Dealership ID is required");
      return;
    }
    if (!UUID_REGEX.test(trimmed)) {
      toast.error("Enter a valid UUID (e.g. bcc16cb3-dd58-44fa-8777-271735a4afb5)");
      return;
    }

    setDealershipIdValue(trimmed);
    setJustSaved(true);
    toast.success("Dev Dealership ID saved", {
      description: "API requests will use this dealership.",
    });
    onSaved?.();

    window.setTimeout(() => setJustSaved(false), 2500);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3">
      <Label
        htmlFor="dev-dealership-id"
        className="text-xs font-medium text-amber-800 dark:text-amber-200"
      >
        Dev Dealership ID
      </Label>
      <div className="flex gap-2">
        <Input
          id="dev-dealership-id"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setJustSaved(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSave();
            }
          }}
          placeholder="UUID for X-Dealership-Id"
          className="h-10 font-mono text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          className="h-10 shrink-0"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
      {dealershipId ? (
        <p className="text-xs text-muted-foreground">
          Active:{" "}
          <span className="font-mono text-foreground">{dealershipId}</span>
          {justSaved ? (
            <span className="ml-2 font-medium text-green-600 dark:text-green-400">
              Saved
            </span>
          ) : null}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          No ID saved yet. Set one to enable API requests.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Stored in localStorage. Auto-filled from NEXT_PUBLIC_DEALERSHIP_ID when set.
      </p>
    </div>
  );
}
