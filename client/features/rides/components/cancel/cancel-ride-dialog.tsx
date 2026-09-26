"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCancelFlow, type UseCancelFlowProps } from "./use-cancel-flow";
import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "cn";

export interface CancelRideDialogProps extends UseCancelFlowProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function CancelRideDialog({
  ride,
  trigger,
  open,
  onOpenChange,
  onSuccess,
  className,
}: CancelRideDialogProps) {
  const {
    isOpen,
    handleOpenChange,
    reason,
    setReason,
    confirm,
    close,
    isSubmitting,
    error,
    isCancellable,
  } = useCancelFlow({ ride, open, onOpenChange, onSuccess });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger render={React.isValidElement(trigger) ? trigger : undefined}>
          {!React.isValidElement(trigger) ? trigger : null}
        </DialogTrigger>
      )}

      <DialogContent className={cn("sm:max-w-sm bg-card border-border shadow-card-elevated", className)}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-ink">
            Cancel Ride?
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-secondary">
            Your reserved seat will be released back to free.
          </DialogDescription>
        </DialogHeader>

        {!isCancellable ? (
          <div className="p-2.5 rounded-md bg-surface text-xs text-ink-secondary border border-border">
            Driver has arrived. Cancellation is no longer available.
          </div>
        ) : (
          <form onSubmit={confirm} className="space-y-3 pt-1">
            <Textarea
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              disabled={isSubmitting}
              className="resize-none text-xs bg-surface border-border"
            />

            {error && (
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-destructive/10 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{error.message || "Failed to cancel ride"}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={close}
                disabled={isSubmitting}
                className="text-xs text-ink-secondary hover:text-ink cursor-pointer hover:cursor-pointer"
              >
                Keep Ride
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={!isCancellable || isSubmitting}
                className="text-xs gap-1.5 cursor-pointer hover:cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  "Cancel Ride"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CancelRideDialog;
