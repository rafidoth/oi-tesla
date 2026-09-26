import * as React from "react"
import { cn } from "cn"

interface ToggleOnlineProps {
  online: boolean
  onToggle: (nextState: boolean) => void
  disabled?: boolean
  className?: string
}

export function ToggleOnline({
  online,
  onToggle,
  disabled = false,
  className,
}: ToggleOnlineProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={online}
      disabled={disabled}
      onClick={() => onToggle(!online)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        online ? "bg-accent-green" : "bg-input",
        className
      )}
    >
      <span className="sr-only">
        {online ? "Driver is online" : "Driver is offline"}
      </span>
      <span
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-surface shadow-sm transition-transform",
          online ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}
