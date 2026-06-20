"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReassignConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ReassignConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: ReassignConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reassign tag?</DialogTitle>
          <DialogDescription>
            This vehicle or ESL tag already has an active assignment. Continuing
            will deactivate the existing pairing and create a new one.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Reassign and pair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
