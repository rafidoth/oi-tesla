"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/features/auth";
import { useHealthCheck } from "@/api";
import { useHydrated } from "@/hooks/use-hydrated";
import { Button, buttonVariants } from "@/components/ui/button";
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
  Navbar,
} from "@/components/custom";
import { Activity, ArrowRight, RefreshCw, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHydrated();

  const { data: health, isLoading, isError, refetch, isFetching } = useHealthCheck();
  const [driverOnline, setDriverOnline] = useState(true);

  // Redirect users visiting root landing page to their designated role dashboard if logged in
  useEffect(() => {
    if (hasHydrated && isAuthenticated && user) {
      if (user.role === "DRIVER") {
        router.replace("/driver/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [hasHydrated, isAuthenticated, user, router]);

  const sampleStatuses: RideStatus[] = [
    "REQUESTED",
    "MATCHED",
    "DRIVER_ARRIVED",
    "STARTED",
    "COMPLETED",
    "CANCELLED",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-start p-6 md:p-12">
        <div className="w-full max-w-3xl flex flex-col gap-8">
          {/* Hero Section */}
          <header className="flex flex-col gap-4 text-center items-center py-6 sm:py-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-surface text-primary border border-primary/20 text-xs font-semibold">
              <Zap className="size-3.5 fill-primary" />
              <span>Dhaka Electric Three-Wheeler Pooling</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight text-ink max-w-xl">
              Shared rides for Dhaka&apos;s battery Teslas.
            </h1>

            <p className="text-ink-secondary text-base sm:text-lg max-w-lg leading-relaxed">
              Street-smart pooled commuting along fixed corridors with fair distance-split pricing and capacity guarantees.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  className: "font-medium gap-2",
                })}
              >
                <span>Sign In</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  className: "font-medium",
                })}
              >
                Create Account
              </Link>
            </div>
          </header>

          {/* API Health Card */}
          <Card className="shadow-card border-border/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  <CardTitle>System & API Health</CardTitle>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : isError ? (
                  <Badge variant="destructive">Backend Offline</Badge>
                ) : (
                  <Badge variant="started">
                    {health?.status?.toUpperCase() || "ONLINE"}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Backend REST endpoint at <code className="font-mono text-xs">/api/health</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : isError ? (
                <div className="p-3 rounded-[var(--radius-md)] bg-accent-red-surface text-accent-red text-sm border border-accent-red/20 font-medium">
                  Backend service is currently unreachable at <code className="font-mono text-xs">/api/health</code>. Ensure the server is running on port 8080.
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
          <Card className="shadow-card border-border/80">
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
