import * as React from "react"
import { cn } from "cn"

interface ChipProps extends React.ComponentProps<"span"> {
  selected?: boolean
}

export function Chip({ className, selected = false, ...props }: ChipProps) {
  return (
    <span
      data-slot="chip"
      data-selected={selected}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors",
        selected
          ? "bg-primary-surface text-ink font-bold ring-1 ring-primary"
          : "bg-surface-subtle text-ink-secondary",
        className
      )}
      {...props}
    />
  )
}
