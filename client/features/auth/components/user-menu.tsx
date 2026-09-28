"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/custom/chip";
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/auth.store";

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/login")}
          className="text-xs"
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={() => router.push("/register")}
          className="text-xs"
        >
          Sign Up
        </Button>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-full bg-surface-subtle flex items-center justify-center text-ink border border-border">
          <UserIcon className="size-4 text-ink-secondary" />
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-ink leading-tight">
            {user.name}
          </span>
          <span className="text-[11px] text-ink-secondary leading-tight truncate max-w-[140px]">
            {user.role === "DRIVER" && user.vehicle
              ? `${user.vehicle.name} (${user.vehicle.capacity} seats)`
              : user.email}
          </span>
        </div>
      </div>

      <Chip selected={user.role === "DRIVER"} className="hidden md:inline-flex text-[11px] py-0.5">
        {user.role === "DRIVER" ? "Driver" : "Passenger"}
      </Chip>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="gap-1.5 text-xs text-ink-secondary hover:text-error hover:bg-error-surface"
        title="Sign Out"
      >
        <LogOut className="size-3.5" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
}

export default UserMenu;
