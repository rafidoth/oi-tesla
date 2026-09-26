"use client";

import * as React from "react";
import { useCurrentUser } from "@/features/auth";
import {
  BookingCard,
  ActiveRideCard,
  useActiveRideQuery,
} from "@/features/rides";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";

export default function PassengerDashboardPage() {
  const { data: userData } = useCurrentUser();
  const userName = userData?.user?.name || "Passenger";

  const { data: activeRide, isLoading: isActiveRideLoading } =
    useActiveRideQuery();

  const isActiveRide = Boolean(
    activeRide &&
      activeRide.status !== "COMPLETED" &&
      activeRide.status !== "CANCELLED"
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-ink-secondary font-medium">
            <Zap className="size-3 fill-black text-black" />
            <span>Tesla Pool</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">
            {userName}
          </h1>
        </div>
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
          <ActiveRideCard ride={activeRide} />
        ) : (
          <BookingCard />
        )}
      </div>
    </div>
  );
}
