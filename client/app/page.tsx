"use client";

import { useHealthCheck } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw, ShieldCheck} from "lucide-react";

export default function Home() {
  const { data: health, isLoading, isError, error, refetch, isFetching } = useHealthCheck();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-xl space-y-6">
        <Card className="shadow-md border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>API Health Status</CardTitle>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : isError ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950/20">
                  <ShieldCheck className="h-3 w-3 mr-1 inline" />
                  {health?.status?.toUpperCase()}
                </Badge>
              )}
            </div>
            <CardDescription>
              Fetched from <code className="font-mono text-xs">/api/health</code> via Axios + React Query
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : isError ? (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error?.message || "Failed to fetch health check"}
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg text-sm space-y-1 font-mono">
                <div><span className="text-muted-foreground">Message:</span> {health?.message}</div>
                <div><span className="text-muted-foreground">Timestamp:</span> {health?.timestamp}</div>
                <div><span className="text-muted-foreground">Uptime:</span> {health?.uptime ? `${Math.round(health.uptime)}s` : "N/A"}</div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">
              {isFetching ? "Refetching in background..." : "Ready"}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Refetch Health
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
