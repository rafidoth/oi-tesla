"use client";

import * as React from "react";
import { Banknote, Zap } from "lucide-react";
import type { PaymentMethod } from "../../types/rides.types";
import { cn } from "cn";

export interface PaymentPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
}

export function PaymentPicker({
  value,
  onChange,
  disabled = false,
  className,
}: PaymentPickerProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
        Payment
      </span>

      <div className="flex items-center gap-1.5 bg-surface border border-border rounded-[var(--radius-md)] p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("CASH")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all select-none cursor-pointer",
            value === "CASH"
              ? "bg-black text-white"
              : "text-ink-secondary hover:text-ink"
          )}
        >
          <Banknote className={cn("size-3.5", value === "CASH" ? "text-white" : "text-ink")} />
          <span>Cash</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("TESLAPAY")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all select-none cursor-pointer",
            value === "TESLAPAY"
              ? "bg-black text-white"
              : "text-ink-secondary hover:text-ink"
          )}
        >
          <Zap className={cn("size-3.5", value === "TESLAPAY" ? "fill-white text-white" : "fill-black text-black")} />
          <span>TeslaPay</span>
        </button>
      </div>
    </div>
  );
}
