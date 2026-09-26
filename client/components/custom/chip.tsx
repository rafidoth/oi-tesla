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
        "inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors leading-none",
        selected
          ? "bg-black text-white font-semibold"
          : "bg-surface-subtle text-ink-secondary border border-transparent",
        className
      )}
      {...props}
    />
  )
}
