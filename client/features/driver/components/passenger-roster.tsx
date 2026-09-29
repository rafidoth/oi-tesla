"use client";

import * as React from "react";
import { Lock, CheckCircle2, Users, Banknote, Check, Loader2 } from "lucide-react";
import { FareDisplay } from "@/components/custom/fare-display";
import { Button } from "@/components/ui/button";
import { useMarkCashReceivedMutation } from "../hooks/use-mark-cash-received-mutation";
import type { DriverPoolRosterMember } from "../types/driver.types";

interface PassengerRosterProps {
  roster: DriverPoolRosterMember[];
  isStarted?: boolean;
  isCompleted?: boolean;
  poolId?: string;
}

export function PassengerRoster({
  roster,
  isStarted,
  isCompleted,
  poolId,
}: PassengerRosterProps) {
  const { mutate: markCashReceived, isPending, variables } =
    useMarkCashReceivedMutation();

  const handleMarkCash = (passengerRideId: string) => {
    markCashReceived({ passengerRideId, poolId });
  };

  return (
    <div className="space-y-4">
      <RosterHeader count={roster.length} isCompleted={isCompleted} />
      <RosterStatusAlert isCompleted={isCompleted} isStarted={isStarted} />
      <RosterContent
        roster={roster}
        isCompleted={isCompleted}
        pendingRideId={isPending ? variables?.passengerRideId : undefined}
        onMarkCash={handleMarkCash}
      />
      <RosterFooter roster={roster} isStarted={isStarted} />
    </div>
  );
}

function RosterHeader({
  count,
  isCompleted,
}: {
  count: number;
  isCompleted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-border/40">
      <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
        {isCompleted ? "Settlement Roster" : "Passengers"}
      </h3>
      <span className="text-sm font-semibold tabular-nums text-ink-secondary">
        {count} {count === 1 ? "passenger" : "passengers"} confirmed
      </span>
    </div>
  );
}

function RosterStatusAlert({
  isCompleted,
  isStarted,
}: {
  isCompleted?: boolean;
  isStarted?: boolean;
}) {
  if (isCompleted) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-ink">
        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
        <span className="font-medium">Trip Completed · Pending payment records initialized</span>
      </div>
    );
  }
  if (isStarted) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border/80 text-sm text-ink-secondary">
        <Lock className="size-3.5 text-ink shrink-0" />
        <span>Fares permanently locked · Trip in motion</span>
      </div>
    );
  }
  return null;
}

function RosterContent({
  roster,
  isCompleted,
  pendingRideId,
  onMarkCash,
}: {
  roster: DriverPoolRosterMember[];
  isCompleted?: boolean;
  pendingRideId?: string;
  onMarkCash: (passengerRideId: string) => void;
}) {
  if (roster.length === 0) {
    return <RosterEmptyState />;
  }
  return (
    <div className="space-y-3">
      {roster.map((member) => (
        <PassengerCard
          key={member.id}
          member={member}
          isCompleted={isCompleted}
          isPending={pendingRideId === member.id}
          onMarkCash={() => onMarkCash(member.id)}
        />
      ))}
    </div>
  );
}

function PassengerCard({
  member,
  isCompleted,
  isPending,
  onMarkCash,
}: {
  member: DriverPoolRosterMember;
  isCompleted?: boolean;
  isPending?: boolean;
  onMarkCash?: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <PassengerIdentity
          member={member}
          isCompleted={isCompleted}
          isPending={isPending}
          onMarkCash={onMarkCash}
        />
        <PassengerFareBlock
          farePaisa={member.farePaisa}
          paymentMethod={member.paymentMethod}
        />
      </div>
      <PassengerDetailsRow member={member} isCompleted={isCompleted} />
    </div>
  );
}

function PassengerIdentity({
  member,
  isCompleted,
  isPending,
  onMarkCash,
}: {
  member: DriverPoolRosterMember;
  isCompleted?: boolean;
  isPending?: boolean;
  onMarkCash?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <PassengerAvatar name={member.passengerName} />
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-ink truncate">
            {member.passengerName}
          </span>
          {isCompleted && member.paymentMethod === "CASH" && (
            <CashCollectionButton
              isPaid={member.paymentStatus === "PAID"}
              isPending={isPending}
              onMarkCash={onMarkCash}
            />
          )}
        </div>
        <div className="text-sm text-ink-secondary truncate flex items-center gap-1">
          <span className="font-medium text-ink">{member.pickupLocationName}</span>
          <span className="text-ink-secondary/60">→</span>
          <span className="font-semibold text-ink">{member.destLocationName}</span>
        </div>
      </div>
    </div>
  );
}

function CashCollectionButton({
  isPaid,
  isPending,
  onMarkCash,
}: {
  isPaid: boolean;
  isPending?: boolean;
  onMarkCash?: () => void;
}) {
  if (isPaid) {
    return (
      <Button
        type="button"
        size="sm"
        disabled
        variant="outline"
        className="h-6 px-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed opacity-90"
      >
        <Check className="size-2.5 mr-1 text-emerald-600" />
        Cash Received
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={onMarkCash}
      className="h-6 px-2 text-[10px] font-semibold bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50 hover:text-black hover:border-black transition-colors cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="size-2.5 animate-spin mr-1" />
          Recording...
        </>
      ) : (
        <>
          <Banknote className="size-2.5 mr-1 text-neutral-700" />
          Mark Cash Received
        </>
      )}
    </Button>
  );
}

function PassengerAvatar({ name }: { name: string }) {
  return (
    <div className="size-9 rounded-full bg-surface-subtle border border-border flex items-center justify-center font-bold text-sm text-ink shrink-0">
      {formatInitials(name)}
    </div>
  );
}

function PassengerFareBlock({
  farePaisa,
  paymentMethod,
}: {
  farePaisa: number;
  paymentMethod: string;
}) {
  const isTeslaPay = paymentMethod === "TESLAPAY";
  return (
    <div className="flex flex-col items-end shrink-0 gap-1.5">
      <FareDisplay paisa={farePaisa} size="sm" align="right" />
      <span
        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${
          isTeslaPay
            ? "bg-sky-50 text-sky-800 border-sky-200"
            : "bg-neutral-100 text-neutral-700 border-neutral-200"
        }`}
      >
        {isTeslaPay ? "TeslaPay" : "Cash"}
      </span>
    </div>
  );
}

function PassengerDetailsRow({
  member,
  isCompleted,
}: {
  member: DriverPoolRosterMember;
  isCompleted?: boolean;
}) {
  const isPaid = member.paymentStatus === "PAID";
  return (
    <div className="flex items-center justify-between text-sm pt-2.5 border-t border-border/50">
      <span className="font-mono text-[11px] text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border/40">
        {member.seats} {member.seats === 1 ? "seat" : "seats"}
      </span>
      {isCompleted && (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {isPaid && <Check className="size-3 text-emerald-600" />}
          {isPaid ? "Paid" : "Pending Settlement"}
        </span>
      )}
    </div>
  );
}

function RosterFooter({
  roster,
  isStarted,
}: {
  roster: DriverPoolRosterMember[];
  isStarted?: boolean;
}) {
  const totalPaisa = roster.reduce((sum, item) => sum + item.farePaisa, 0);
  return (
    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-ink-secondary">
          Total
        </span>
        {isStarted && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface border border-border text-ink-secondary">
            <Lock className="size-2.5" />
            Locked
          </span>
        )}
      </div>
      <FareDisplay paisa={totalPaisa} size="sm" align="right" />
    </div>
  );
}

function RosterEmptyState() {
  return (
    <div className="p-8 text-center rounded-xl bg-surface-subtle/50 border border-dashed border-border text-sm text-ink-secondary space-y-2">
      <Users className="size-6 text-ink-secondary/60 mx-auto" />
      <div>No active passengers assigned to this pool.</div>
    </div>
  );
}

export function PassengerRosterSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-neutral-200 rounded w-1/3" />
      <div className="h-24 bg-neutral-100 rounded-xl" />
      <div className="h-24 bg-neutral-100 rounded-xl" />
    </div>
  );
}

function formatInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default PassengerRoster;
