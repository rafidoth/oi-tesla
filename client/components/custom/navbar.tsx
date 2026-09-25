"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { UserMenu } from "@/features/auth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full h-[60px] bg-surface border-b border-surface-subtle px-4 sm:px-8 flex items-center justify-between">
      {/* Brand logo & title */}
      <Link
        href="/"
        className="flex items-center gap-2 text-primary font-heading font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
      >
        <div className="size-8 rounded-[var(--radius-sm)] bg-primary-surface flex items-center justify-center">
          <Zap className="size-4.5 fill-primary text-primary" />
        </div>
        <span className="text-ink font-heading font-bold text-lg">
          Oi<span className="text-primary">Tesla</span>
        </span>
      </Link>

      {/* User profile & actions */}
      <UserMenu />
    </header>
  );
}

export default Navbar;
