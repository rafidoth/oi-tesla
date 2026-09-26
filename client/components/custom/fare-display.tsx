import * as React from "react"
import { cn } from "cn"

interface FareDisplayProps extends React.ComponentProps<"div"> {
  amount?: number | string
  paisa?: number
  size?: "default" | "sm"
  align?: "right" | "left" | "center"
}

export function FareDisplay({
  amount,
  paisa,
  size = "default",
  align = "right",
  className,
  ...props
}: FareDisplayProps) {
  // Format paisa to BDT if provided, else format amount
  const displayAmount = React.useMemo(() => {
    if (typeof paisa === "number") {
      return (paisa / 100).toFixed(0)
    }
    if (typeof amount === "number") {
      return amount.toLocaleString()
    }
    return amount || "0"
  }, [amount, paisa])

  return (
    <div
      data-slot="fare-display"
      className={cn(
        "inline-flex items-baseline gap-1.5",
        align === "right" && "justify-end text-right",
        align === "center" && "justify-center text-center",
        align === "left" && "justify-start text-left",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "font-heading font-bold tabular-nums text-ink tracking-tight",
          size === "default" && "text-[28px] leading-tight",
          size === "sm" && "text-base leading-snug"
        )}
      >
        {displayAmount}
      </span>
      <span
        className={cn(
          "font-sans font-normal text-ink-secondary",
          size === "default" && "text-sm",
          size === "sm" && "text-xs"
        )}
      >
        BDT
      </span>
    </div>
  )
}
