"use client";

import * as React from "react";
import { SeatStepper, type SeatStepperProps } from "./booking/seat-stepper";

export type SeatSelectorProps = SeatStepperProps;

/**
 * Passenger seat selector wrapper.
 */
export function SeatSelector(props: SeatSelectorProps) {
  return <SeatStepper {...props} />;
}

export default SeatSelector;
