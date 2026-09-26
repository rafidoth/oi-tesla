"use client";

import * as React from "react";
import { BookingCard, type BookingCardProps } from "./booking/booking-card";

export type BookingFormProps = BookingCardProps;

/**
 * Passenger ride booking form.
 * Composes modular subcomponents: LocationPicker, SeatStepper, PaymentPicker, and FareTag.
 */
export function BookingForm(props: BookingFormProps) {
  return <BookingCard {...props} />;
}

export default BookingForm;
