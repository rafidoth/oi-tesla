"use client";

import { RoleGuard } from "@/features/auth";
import { Navbar } from "@/components/custom";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["DRIVER"]}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
