"use client";

import * as React from "react";
import { useCurrentUser } from "@/features/auth";
import {
  BookingCard,
  ActiveRideCard,
  useActiveRideQuery,
  RideHistoryDrawer,
} from "@/features/rides";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Zap } from "lucide-react";

export default function PassengerDashboardPage() {
  const { data: userData } = useCurrentUser();
  const userName = userData?.user?.name || "Passenger";

  const { data: activeRide, isLoading: isActiveRideLoading } =
    useActiveRideQuery();

  const [dismissedRideId, setDismissedRideId] = React.useState<string | null>(null);

  const isActiveRide = Boolean(
    activeRide &&
      activeRide.status !== "CANCELLED" &&
      activeRide.id !== dismissedRideId
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm text-ink-secondary font-medium">
            <Zap className="size-3.5 fill-black text-black" />
            <span>Tesla Pool</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">
            {userName}
          </h1>
        </div>

        <RideHistoryDrawer
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-sm font-semibold h-8.5 px-3 rounded-lg border-border hover:bg-surface-subtle text-ink cursor-pointer"
            >
              <Clock className="size-3.5 text-ink-secondary" />
              <span>Past Rides</span>
            </Button>
          }
        />
      </div>

      {/* Main Focus View */}
      <div>
        {isActiveRideLoading && !activeRide ? (
          <Card className="border-border shadow-card bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-xs" animate />
              <Skeleton className="h-6 w-20 rounded-full" animate />
            </div>
            <Skeleton className="h-14 w-full rounded-md" animate />
            <Skeleton className="h-10 w-full rounded-md" animate />
            <Skeleton className="h-12 w-full rounded-md" animate />
          </Card>
        ) : isActiveRide && activeRide ? (
          <ActiveRideCard
            ride={activeRide}
            onDismissCompleted={() => setDismissedRideId(activeRide.id)}
          />
        ) : (
          <BookingCard />
        )}
      </div>
    </div>
  );
}
