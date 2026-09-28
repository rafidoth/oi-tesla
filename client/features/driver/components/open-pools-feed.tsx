"use client";

import * as React from "react";
import { RefreshCw, Car, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenPoolCard } from "./open-pool-card";
import type { OpenPoolItem } from "../types/driver.types";

interface OpenPoolsFeedProps {
  pools?: OpenPoolItem[];
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: Error | null;
  acceptingPoolId?: string | null;
  decliningPoolId?: string | null;
  acceptError?: string | null;
  onClearAcceptError?: () => void;
  onRefresh?: () => void;
  onAccept?: (poolId: string) => void;
  onDecline?: (poolId: string) => void;
}

export function OpenPoolsFeed({
  pools,
  isLoading,
  isFetching = false,
  isError = false,
  error,
  acceptingPoolId,
  decliningPoolId,
  acceptError,
  onClearAcceptError,
  onRefresh,
  onAccept,
  onDecline,
}: OpenPoolsFeedProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-ink">Available Pools</h2>
          {pools && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-muted text-ink border border-border">
              {pools.length}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary ml-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Feed</span>
          </span>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading || isFetching}
            className="text-xs h-8 gap-1.5 text-ink-secondary hover:text-ink cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {acceptError && (
        <Card className="border-error/20 bg-error-surface p-4 text-error flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold">Acceptance Failed</h4>
              <p className="text-xs text-error/90 mt-0.5">{acceptError}</p>
            </div>
          </div>
          {onClearAcceptError && (
            <button
              type="button"
              onClick={onClearAcceptError}
              className="text-xs text-error hover:underline cursor-pointer shrink-0 font-medium"
            >
              Dismiss
            </button>
          )}
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Card className="p-5 space-y-3 border border-border/80">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-28 rounded-xs" animate />
                <Skeleton className="h-5 w-48 rounded-sm" animate />
              </div>
              <Skeleton className="h-6 w-20 rounded-xs" animate />
            </div>
            <div className="pt-2 border-t border-border/60">
              <Skeleton className="h-3 w-36 rounded-xs" animate />
            </div>
          </Card>
          <Card className="p-5 space-y-3 border border-border/80">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-28 rounded-xs" animate />
                <Skeleton className="h-5 w-48 rounded-sm" animate />
              </div>
              <Skeleton className="h-6 w-20 rounded-xs" animate />
            </div>
            <div className="pt-2 border-t border-border/60">
              <Skeleton className="h-3 w-36 rounded-xs" animate />
            </div>
          </Card>
        </div>
      ) : isError ? (
        <Card className="border-error/20 bg-error-surface p-5 space-y-3 shadow-xs">
          <div className="flex items-start gap-3 text-error">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold tracking-tight">Failed to load pools</h3>
              <p className="text-xs text-error/90 mt-0.5">
                {error?.message || "Could not retrieve available open pools."}
              </p>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="text-xs shrink-0 border-error/30 hover:bg-error/10 text-error gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        </Card>
      ) : !pools || pools.length === 0 ? (
        <Card className="p-8 border border-border/80 text-center space-y-3 bg-card shadow-xs">
          <div className="size-10 rounded-full bg-surface-muted flex items-center justify-center text-ink-secondary mx-auto">
            <Car className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-ink">No compatible pools available</h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              Waiting for new passenger requests matching your vehicle capacity. Newly formed pools will appear here automatically.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {pools.map((pool) => (
            <OpenPoolCard
              key={pool.id}
              pool={pool}
              onAccept={onAccept}
              onDecline={onDecline}
              isAccepting={acceptingPoolId === pool.id}
              isDeclining={decliningPoolId === pool.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OpenPoolsFeed;
