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
    className: "bg-info-surface text-info",
  },
  DRIVER_ARRIVED: {
    defaultLabel: "Driver Arrived",
    className: "bg-warning-surface text-warning",
  },
  STARTED: {
    defaultLabel: "In Motion",
    className: "bg-success-surface text-success",
  },
  COMPLETED: {
    defaultLabel: "Completed",
    className: "bg-surface-subtle text-ink-secondary",
  },
  CANCELLED: {
    defaultLabel: "Cancelled",
    className: "bg-error-surface text-error",
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
