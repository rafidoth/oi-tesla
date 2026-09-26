"use client";

import { Suspense } from "react";
import { LoginForm } from "@/features/auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md h-96 p-6 flex flex-col gap-4">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-4 w-60 mx-auto" />
          <Skeleton className="h-10 w-full mt-4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
