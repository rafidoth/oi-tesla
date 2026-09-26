import * as React from "react"
import { cn } from "cn"

interface SeatMeterProps extends React.ComponentProps<"div"> {
  occupiedSeats: number
  capacity: number
  showCount?: boolean
  size?: "default" | "sm"
}

export function SeatMeter({
  occupiedSeats,
  capacity,
  showCount = false,
  size = "default",
  className,
  ...props
}: SeatMeterProps) {
  const safeCapacity = Math.max(0, capacity)
  const safeOccupied = Math.min(Math.max(0, occupiedSeats), safeCapacity)

  return (
    <div
      data-slot="seat-meter"
      role="meter"
      aria-label={`Seat meter: ${safeOccupied} of ${safeCapacity} seats occupied`}
      aria-valuenow={safeOccupied}
      aria-valuemin={0}
      aria-valuemax={safeCapacity}
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: safeCapacity }).map((_, i) => {
          const isOccupied = i < safeOccupied
          return (
            <span
              key={i}
              className={cn(
                "rounded-[var(--radius-sm)] transition-colors",
                size === "sm" ? "size-2" : "size-2.5",
                isOccupied
                  ? "bg-primary border border-primary"
                  : "bg-surface-subtle border border-input"
              )}
            />
          )
        })}
      </div>
      {showCount && (
        <span className="font-mono text-xs tabular-nums text-ink-secondary ml-1">
          {safeOccupied}/{safeCapacity}
        </span>
      )}
    </div>
  )
}
