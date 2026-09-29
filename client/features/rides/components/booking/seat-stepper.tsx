"use client";

import * as React from "react";
import { cn } from "cn";

export interface SeatStepperProps {
  value: number;
  onChange: (seats: number) => void;
  maxSeats?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Modern tactile seat glyph with filled and unfilled states.
 */
function SeatGlyph({
  filled = false,
  className = "size-5",
}: {
  filled?: boolean;
  className?: string;
}) {
  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <rect x="7" y="2" width="10" height="4" rx="2" />
        <path d="M6 7h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
        <path d="M4 18h16a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 1 4 18z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="7" y="2" width="10" height="4" rx="2" />
      <path d="M6 7h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <path d="M4 18h16v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1z" />
    </svg>
  );
}

/**
 * Clean Segmented Pill seat selector.
 * Allows passengers to directly click seat glyphs to choose their required seats,
 * complete with sequential active illumination, inline count badge, and micro-stepper controls.
 */
export function SeatStepper({
  value,
  onChange,
  maxSeats = 4,
  disabled = false,
  className,
}: SeatStepperProps) {
  const seatOptions = React.useMemo(() => {
    return Array.from({ length: Math.max(1, maxSeats) }, (_, i) => i + 1);
  }, [maxSeats]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header with Title and Live Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wider text-ink-secondary">
          Seats
        </span>

        {/* Live Count Display */}
        <div
          className="flex items-center gap-1.5 text-sm text-ink"
          aria-label={`${value} of ${maxSeats} seats selected`}
        >
          <span className="font-bold text-primary font-mono text-base tabular-nums">
            {value}
          </span>
          <span className="text-ink-secondary font-medium">
            {value === 1 ? "Seat" : "Seats"}
          </span>
          <span className="text-xs text-ink-secondary font-mono tabular-nums">
            ({value}/{maxSeats})
          </span>
        </div>
      </div>

      {/* Clean Segmented Pill Container */}
      <div className="flex items-center p-1.5 bg-surface border border-border rounded-xl shadow-xs">
        {/* Direct Interactive Seat Icons */}
        <div
          role="group"
          aria-label="Select number of seats"
          className="flex items-center gap-1.5 flex-1"
        >
          {seatOptions.map((seatNum) => {
            const isFilled = seatNum <= value;
            return (
              <button
                key={seatNum}
                type="button"
                role="button"
                aria-label={`Select ${seatNum} seat${seatNum > 1 ? "s" : ""}`}
                aria-pressed={isFilled}
                disabled={disabled}
                onClick={() => onChange(seatNum)}
                className={cn(
                  "flex-1 h-11 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none outline-none",
                  "focus-visible:ring-2 focus-visible:ring-primary/20",
                  isFilled
                    ? "bg-primary text-primary-foreground font-bold shadow-xs hover:bg-[var(--color-primary-strong)]"
                    : "text-ink-secondary hover:text-ink hover:bg-surface-subtle",
                  disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <SeatGlyph
                  filled={isFilled}
                  className={cn(
                    "size-5 transition-transform duration-150",
                    isFilled ? "scale-105" : "scale-100"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SeatStepper;
