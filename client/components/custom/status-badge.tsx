import * as React from "react"
import { cn } from "cn"

export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED"

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: RideStatus
  label?: string
}

const statusConfig: Record<
  RideStatus,
  { defaultLabel: string; className: string }
> = {
  REQUESTED: {
    defaultLabel: "Requested",
    className: "bg-surface-subtle text-ink-secondary",
  },
  MATCHED: {
    defaultLabel: "Matched",
    className: "bg-teal-surface text-teal-strong",
  },
  DRIVER_ARRIVED: {
    defaultLabel: "Driver Arrived",
    className: "bg-accent-amber-surface text-ink font-semibold",
  },
  STARTED: {
    defaultLabel: "In Motion",
    className: "bg-accent-green-surface text-accent-green",
  },
  COMPLETED: {
    defaultLabel: "Completed",
    className: "bg-accent-slate-surface text-accent-slate",
  },
  CANCELLED: {
    defaultLabel: "Cancelled",
    className: "bg-accent-red-surface text-accent-red",
  },
}

export function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.REQUESTED
  const displayLabel = label || config.defaultLabel

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap leading-none",
        config.className,
        className
      )}
      {...props}
    >
      {displayLabel}
    </span>
  )
}
