"use client";

import * as React from "react";
import { MapPin, Play, CheckCircle2, AlertCircle, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePoolTransitionMutation } from "../hooks/use-pool-transition-mutation";
import type { PoolLifecycleAction } from "../types/driver.types";

interface PoolLifecycleActionsProps {
  poolId: string;
  status: string;
  onResetConsole?: () => void;
}

interface LifecycleActionConfig {
  action: PoolLifecycleAction;
  label: string;
  description: string;
  buttonClassName: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PoolLifecycleActions({
  poolId,
  status,
  onResetConsole,
}: PoolLifecycleActionsProps) {
  const { mutate, isPending } = usePoolTransitionMutation();
  const actionConfig = getLifecycleActionConfig(status);

  if (!actionConfig) {
    return <TerminalStateNotice status={status} onResetConsole={onResetConsole} />;
  }

  const Icon = actionConfig.icon;

  return (
    <div className="pt-4 border-t border-border/60">
      <Button
        type="button"
        disabled={isPending}
        onClick={() => mutate({ poolId, action: actionConfig.action })}
        className={`w-full py-2.5 font-semibold text-sm rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${actionConfig.buttonClassName}`}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Icon className="size-4" />
            <span>{actionConfig.label}</span>
          </>
        )}
      </Button>
    </div>
  );
}

function getLifecycleActionConfig(status: string): LifecycleActionConfig | null {
  switch (status) {
    case "MATCHED":
      return {
        action: "arrive",
        label: "Mark Arrived",
        description: "Signal arrival at the pickup hub to notify waiting passengers.",
        buttonClassName: "bg-black text-white hover:bg-black/90",
        icon: MapPin,
      };
    case "DRIVER_ARRIVED":
      return {
        action: "start",
        label: "Start Trip",
        description: "All passengers boarded. Individual fares will be permanently frozen.",
        buttonClassName: "bg-brand text-black hover:bg-brand/90",
        icon: Play,
      };
    case "STARTED":
      return {
        action: "complete",
        label: "Complete Trip",
        description: "Arrived at final destination. Initialize fare settlement.",
        buttonClassName: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        icon: CheckCircle2,
      };
    default:
      return null;
  }
}

function TerminalStateNotice({
  status,
  onResetConsole,
}: {
  status: string;
  onResetConsole?: () => void;
}) {
  if (status === "COMPLETED") {
    return (
      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="flex items-center gap-2 text-sm text-ink bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Trip completed. All fares initialized for settlement.</span>
        </div>
        {onResetConsole && (
          <Button
            type="button"
            onClick={onResetConsole}
            className="w-full py-2.5 font-semibold text-sm rounded-lg bg-black text-white hover:bg-black/90 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Search className="size-3.5" />
            <span>Look for New Rides</span>
          </Button>
        )}
      </div>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="flex items-center gap-2 text-sm text-ink-secondary bg-red-50/50 p-3 rounded-lg">
          <AlertCircle className="size-4 text-red-600 shrink-0" />
          <span>Trip cancelled. No active passengers remaining.</span>
        </div>
        {onResetConsole && (
          <Button
            type="button"
            variant="outline"
            onClick={onResetConsole}
            className="w-full py-2.5 font-semibold text-sm rounded-lg border-border hover:bg-surface-subtle transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Return to Dashboard
          </Button>
        )}
      </div>
    );
  }

  return null;
}

export default PoolLifecycleActions;
