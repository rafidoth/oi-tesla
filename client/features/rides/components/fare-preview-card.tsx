"use client";

import * as React from "react";
import { FareTag, type FareTagProps } from "./booking/fare-tag";

export type FarePreviewCardProps = FareTagProps;

/**
 * Upfront solo fare estimate tag wrapper.
 */
export function FarePreviewCard(props: FarePreviewCardProps) {
  return <FareTag {...props} />;
}

export default FarePreviewCard;
