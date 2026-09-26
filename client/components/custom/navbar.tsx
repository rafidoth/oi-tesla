"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { UserMenu } from "@/features/auth";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between">
      {/* Brand logo & title */}
      <Link
        href="/"
        className="flex items-center gap-2.5 text-ink font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
      >
        <div className="size-7 rounded-[var(--radius-sm)] bg-black flex items-center justify-center text-white">
          <Zap className="size-4 fill-white text-white" />
        </div>
        <span className="text-ink font-bold text-base tracking-tight">
          OiTesla
        </span>
      </Link>

      {/* User profile & actions */}
      <UserMenu />
    </header>
  );
}

export default Navbar;
