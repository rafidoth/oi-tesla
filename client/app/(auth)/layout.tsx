"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth";
import { Navbar } from "@/components/custom";
import { useHydrated } from "@/hooks/use-hydrated";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && isAuthenticated && user) {
      if (user.role === "DRIVER") {
        router.replace("/driver/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [hydrated, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}
