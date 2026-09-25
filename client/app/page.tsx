"use client";

import { useState } from "react";
import { useHealthCheck } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  StatusBadge,
  type RideStatus,
  SeatMeter,
  FareDisplay,
  Chip,
  ToggleOnline,
} from "@/components/custom";
import { Activity, RefreshCw, Zap } from "lucide-react";

export default function Home() {
  const { data: health, isLoading, isError, error, refetch, isFetching } = useHealthCheck();
  const [driverOnline, setDriverOnline] = useState(true);

  const sampleStatuses: RideStatus[] = [
    "REQUESTED",
    "MATCHED",
    "DRIVER_ARRIVED",
    "STARTED",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12 bg-background text-foreground">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Brand Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary font-heading font-bold text-xl tracking-tight">
            <Zap className="size-5 fill-primary" />
            <span>OiTesla</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Dhaka Tesla Pool
          </h1>
          <p className="text-ink-secondary text-sm md:text-base leading-relaxed">
            High-energy, street-smart ride-pooling for Dhaka’s electric three-wheelers.
            Built with Marigold accents, fixed lifecycle signals, and precision tabular metrics.
          </p>
        </header>

        {/* API Health Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="size-5 text-primary" />
                <CardTitle>API Health Status</CardTitle>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : isError ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge variant="started">
                  {health?.status?.toUpperCase() || "ONLINE"}
                </Badge>
              )}
            </div>
            <CardDescription>
              Backend endpoint at <code className="font-mono text-xs">/api/health</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : isError ? (
              <div className="p-3 rounded-[var(--radius-md)] bg-accent-red-surface text-accent-red text-sm font-medium">
                {error?.message || "Failed to connect to backend service"}
              </div>
            ) : (
              <div className="bg-surface-subtle p-4 rounded-[var(--radius-md)] text-sm flex flex-col gap-1 font-mono">
                <div>
                  <span className="text-ink-secondary">Message:</span>{" "}
                  <span className="text-ink font-medium">{health?.message}</span>
                </div>
                <div>
                  <span className="text-ink-secondary">Timestamp:</span>{" "}
                  <span className="text-ink">{health?.timestamp}</span>
                </div>
                <div>
                  <span className="text-ink-secondary">Uptime:</span>{" "}
                  <span className="text-ink tabular-nums">
                    {health?.uptime ? `${Math.round(health.uptime)}s` : "N/A"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <span className="text-xs text-ink-secondary">
              {isFetching ? "Syncing..." : "Ready"}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refetch Health
            </Button>
          </CardFooter>
        </Card>

        {/* UI Design System Showcase */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Design System Elements (UI_DESIGN.md)</CardTitle>
            <CardDescription>
              Visual tokens, lifecycle indicators, and invariant meters
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Ride State Badges */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-secondary">
                1. Ride Lifecycle States (Fixed Pairings)
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleStatuses.map((st) => (
                  <StatusBadge key={st} status={st} />
                ))}
              </div>
            </div>

            {/* Invariants & Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border p-4 rounded-[var(--radius-md)] bg-surface">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-secondary">
                  2. Seat Capacity Invariant (● ● ○)
                </span>
                <div className="flex items-center gap-3">
                  <SeatMeter occupiedSeats={2} capacity={3} showCount />
                  <span className="text-xs text-ink-secondary">occupied &le; capacity</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:items-end">
                <span className="text-xs font-semibold text-ink-secondary">
                  3. Fare Display (Tabular Numeral)
                </span>
                <FareDisplay amount={120} align="right" />
              </div>
            </div>

            {/* Interactive Components */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-secondary">
                4. Driver Console Toggle & Chips
              </span>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <ToggleOnline
                    online={driverOnline}
                    onToggle={setDriverOnline}
                  />
                  <span className="text-sm font-medium text-ink">
                    {driverOnline ? "Console Online" : "Console Offline"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Chip selected>Cash</Chip>
                  <Chip>TeslaPay</Chip>
                  <Chip>Mirpur Corridor</Chip>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-ink-secondary">
                5. Actions (Marigold Primary reserved for actions)
              </span>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="default">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="ghost">Ghost Link</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
