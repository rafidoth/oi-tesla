"use client";

import * as React from "react";
import { BookingCard, type BookingCardProps } from "./booking/booking-card";

export type GetRideCardProps = BookingCardProps;

/**
 * Passenger ride request card.
 * Refactored into modular subcomponents: LocationPicker, SeatStepper, PaymentPicker, and FareTag.
 */
export function GetRideCard(props: GetRideCardProps) {
  return <BookingCard {...props} />;
}

export default GetRideCard;
