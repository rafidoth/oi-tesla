"use client"

import * as React from "react"
import { cn } from "cn"

export interface FareDisplayProps extends React.ComponentProps<"div"> {
  amount?: number | string
  paisa?: number
  originalPaisa?: number
  showSavings?: boolean
  savingsFormat?: "percent" | "amount"
  animateChange?: boolean
  size?: "default" | "sm"
  align?: "right" | "left" | "center"
}

export function FareDisplay({
  amount,
  paisa,
  originalPaisa,
  showSavings,
  savingsFormat = "percent",
  animateChange = false,
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

  // Savings calculations when discounted fare is provided relative to original solo fare
  const hasSavings =
    typeof originalPaisa === "number" &&
    typeof paisa === "number" &&
    originalPaisa > paisa

  const isSavingsVisible = (showSavings !== undefined ? showSavings : hasSavings) && hasSavings

  const { savingsPaisa, discountPct, originalDisplayAmount } = React.useMemo(() => {
    if (!hasSavings || originalPaisa === undefined || paisa === undefined) {
      return { savingsPaisa: 0, discountPct: 0, originalDisplayAmount: "0" }
    }
    const diff = originalPaisa - paisa
    const pct = Math.round((diff / originalPaisa) * 100)
    return {
      savingsPaisa: diff,
      discountPct: pct,
      originalDisplayAmount: (originalPaisa / 100).toFixed(0),
    }
  }, [hasSavings, originalPaisa, paisa])

  // Badge text (percentage discount by default e.g. "Save 30%", or fixed amount "Save 43 BDT")
  const badgeText =
    savingsFormat === "amount"
      ? `Save ${(savingsPaisa / 100).toFixed(0)} BDT`
      : `Save ${discountPct}%`

  // Subtle pulse animation on live fare recomputation/update
  const [isPulsing, setIsPulsing] = React.useState(false)
  const prevValueRef = React.useRef<number | string | undefined>(paisa ?? amount)

  React.useEffect(() => {
    if (!animateChange) return

    const currentValue = paisa ?? amount
    if (
      prevValueRef.current !== undefined &&
      currentValue !== undefined &&
      prevValueRef.current !== currentValue
    ) {
      setIsPulsing(true)
      const timer = setTimeout(() => {
        setIsPulsing(false)
      }, 700)
      prevValueRef.current = currentValue
      return () => clearTimeout(timer)
    }

    prevValueRef.current = currentValue
  }, [paisa, amount, animateChange])

  const fareNumNode = (
    <span
      className={cn(
        "inline-block font-bold tabular-nums text-ink tracking-tight transition-all duration-200",
        align === "right" && "origin-right",
        align === "center" && "origin-center",
        align === "left" && "origin-left",
        size === "default" && "text-[28px] leading-tight",
        size === "sm" && "text-base leading-snug",
        isPulsing && "opacity-75"
      )}
    >
      {displayAmount}
    </span>
  )

  const currencyNode = (
    <span
      className={cn(
        "font-normal text-ink-secondary",
        size === "default" && "text-sm",
        size === "sm" && "text-xs"
      )}
    >
      BDT
    </span>
  )

  if (isSavingsVisible) {
    return (
      <div
        data-slot="fare-display"
        className={cn(
          "inline-flex flex-col gap-0.5",
          align === "right" && "items-end text-right",
          align === "center" && "items-center text-center",
          align === "left" && "items-start text-left",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 flex-wrap",
            align === "right" && "justify-end",
            align === "center" && "justify-center",
            align === "left" && "justify-start"
          )}
        >
          <span className="sr-only">Original fare:</span>
          <span
            className={cn(
              "line-through text-ink-secondary tabular-nums",
              size === "sm" ? "text-xs" : "text-sm"
            )}
          >
            {originalDisplayAmount} BDT
          </span>
          <span className="bg-surface-subtle text-ink-secondary border border-border text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span>{badgeText}</span>
          </span>
        </div>

        <div
          className={cn(
            "inline-flex items-baseline gap-1.5",
            align === "right" && "justify-end text-right",
            align === "center" && "justify-center text-center",
            align === "left" && "justify-start text-left"
          )}
        >
          <span className="sr-only">Discounted fare:</span>
          {fareNumNode}
          {currencyNode}
        </div>
      </div>
    )
  }

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
      {fareNumNode}
      {currencyNode}
    </div>
  )
}
