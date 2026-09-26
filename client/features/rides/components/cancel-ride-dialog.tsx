"use client";

import * as React from "react";
import {
  CancelRideDialog as ModularCancelRideDialog,
  type CancelRideDialogProps,
} from "./cancel/cancel-ride-dialog";

export type { CancelRideDialogProps };

/**
 * Passenger ride cancellation dialog wrapper.
 */
export function CancelRideDialog(props: CancelRideDialogProps) {
  return <ModularCancelRideDialog {...props} />;
}

export default CancelRideDialog;
