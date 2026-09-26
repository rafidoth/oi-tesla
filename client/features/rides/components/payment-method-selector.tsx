"use client";

import * as React from "react";
import { PaymentPicker, type PaymentPickerProps } from "./booking/payment-picker";

export type PaymentMethodSelectorProps = PaymentPickerProps;

/**
 * Ride payment settlement method selector wrapper.
 */
export function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  return <PaymentPicker {...props} />;
}

export default PaymentMethodSelector;
