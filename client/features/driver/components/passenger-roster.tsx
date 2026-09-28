"use client";

import * as React from "react";
import { Lock, CheckCircle2, Users } from "lucide-react";
import { FareDisplay } from "@/components/custom/fare-display";
import type { DriverPoolRosterMember } from "../types/driver.types";

interface PassengerRosterProps {
  roster: DriverPoolRosterMember[];
  isStarted?: boolean;
  isCompleted?: boolean;
}

export function PassengerRoster({
  roster,
  isStarted,
  isCompleted,
}: PassengerRosterProps) {
  return (
    <div className="space-y-4">
      <RosterHeader count={roster.length} isCompleted={isCompleted} />
      <RosterStatusAlert isCompleted={isCompleted} isStarted={isStarted} />
      <RosterContent roster={roster} isCompleted={isCompleted} />
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
      <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
        {isCompleted ? "Settlement Roster" : "Passenger Roster"}
      </h3>
      <span className="text-xs font-semibold tabular-nums text-ink-secondary">
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
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-ink">
        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
        <span className="font-medium">Trip Completed · Pending payment records initialized</span>
      </div>
    );
  }
  if (isStarted) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-subtle border border-border/80 text-xs text-ink-secondary">
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
}: {
  roster: DriverPoolRosterMember[];
  isCompleted?: boolean;
}) {
  if (roster.length === 0) {
    return <RosterEmptyState />;
  }
  return (
    <div className="space-y-3">
      {roster.map((member) => (
        <PassengerCard key={member.id} member={member} isCompleted={isCompleted} />
      ))}
    </div>
  );
}

function PassengerCard({
  member,
  isCompleted,
}: {
  member: DriverPoolRosterMember;
  isCompleted?: boolean;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-border/70 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3 hover:border-border transition-colors">
      <div className="flex items-start justify-between gap-3">
        <PassengerIdentity member={member} />
        <PassengerFareBlock
          farePaisa={member.farePaisa}
          paymentMethod={member.paymentMethod}
        />
      </div>
      <PassengerDetailsRow member={member} isCompleted={isCompleted} />
    </div>
  );
}

function PassengerIdentity({ member }: { member: DriverPoolRosterMember }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <PassengerAvatar name={member.passengerName} />
      <div className="min-w-0 space-y-0.5">
        <div className="font-bold text-sm text-ink truncate">
          {member.passengerName}
        </div>
        <div className="text-xs text-ink-secondary truncate flex items-center gap-1">
          <span className="font-medium text-ink">{member.pickupLocationName}</span>
          <span className="text-ink-secondary/60">→</span>
          <span className="font-semibold text-ink">{member.destLocationName}</span>
        </div>
      </div>
    </div>
  );
}

function PassengerAvatar({ name }: { name: string }) {
  return (
    <div className="size-9 rounded-full bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-ink shrink-0">
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
    <div className="text-right shrink-0 space-y-1">
      <FareDisplay paisa={farePaisa} size="sm" align="right" />
      <span
        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
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
    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/50">
      <span className="font-mono text-[11px] text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded border border-border/40">
        {member.seats} {member.seats === 1 ? "seat" : "seats"} allocated
      </span>
      {isCompleted ? (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
            isPaid
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          {isPaid ? "Paid" : "Pending Settlement"}
        </span>
      ) : (
        <span className="text-[11px] font-medium text-ink-secondary">
          Confirmed Rider
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
        <span className="text-xs font-semibold text-ink-secondary">
          {isStarted ? "Final Pool Value" : "Total Pool Value"}
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
    <div className="p-8 text-center rounded-xl bg-surface-subtle/50 border border-dashed border-border text-xs text-ink-secondary space-y-2">
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
