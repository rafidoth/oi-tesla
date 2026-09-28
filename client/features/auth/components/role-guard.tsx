"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import type { UserRole } from "../types/auth.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, isAuthenticated, isLoading } = useAuthStore();
  const hasHydrated = useHydrated();

  useEffect(() => {
    if (!hasHydrated || isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Cross-role redirect to permitted dashboard
      if (user.role === "DRIVER") {
        router.replace("/driver/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [hasHydrated, isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

  // Loading / hydration screen
  if (!hasHydrated || isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded-[var(--radius-md)]" />
        <Skeleton className="h-32 w-full max-w-lg " />
      </div>
    );
  }

  // If wrong role, keep rendering placeholder while redirecting
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="h-8 w-48 rounded-[var(--radius-md)]" />
      </div>
    );
  }

  return <>{children}</>;
}

export default RoleGuard;
