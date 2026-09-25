"use client";

import { Suspense } from "react";
import { RegisterForm } from "@/features/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-lg h-[450px] p-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-10 w-full mt-4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
