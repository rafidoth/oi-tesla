"use client";

import * as React from "react";
import { useCancelRideMutation } from "../../hooks/use-cancel-ride-mutation";
import type { ActiveRideDetailsDto } from "../../types/rides.types";

export interface UseCancelFlowProps {
  ride: ActiveRideDetailsDto;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function useCancelFlow({
  ride,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: UseCancelFlowProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      setControlledOpen?.(nextOpen);
      if (!nextOpen) {
        setReason("");
      }
    },
    [isControlled, setControlledOpen]
  );

  const cancelMutation = useCancelRideMutation({
    onSuccess: () => {
      handleOpenChange(false);
      onSuccess?.();
    },
  });

  const confirm = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ride.isCancellable || cancelMutation.isPending) return;

    cancelMutation.mutate({
      rideId: ride.id,
      payload: reason.trim() ? { reason: reason.trim() } : undefined,
    });
  };

  const close = () => {
    handleOpenChange(false);
  };

  return {
    isOpen,
    handleOpenChange,
    reason,
    setReason,
    confirm,
    close,
    isSubmitting: cancelMutation.isPending,
    error: cancelMutation.error,
    isCancellable: ride.isCancellable,
  };
}
