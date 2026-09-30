"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore, AuthModal, useAuthModalStore } from "@/features/auth";
import { useHydrated } from "@/hooks/use-hydrated";
import { FareEstimatorCard } from "@/features/rides";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, Coins, Zap, ArrowRight } from "lucide-react";

function LandingNavbar() {
  const { openModal } = useAuthModalStore();

  return (
    <header className="h-14 px-4 sm:px-8 bg-gradient-to-b from-white to-transparent sticky top-0 z-20 flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between bg-transparent">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 rounded bg-black text-white font-black flex items-center justify-center">
            <Zap className="size-4 fill-current" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-ink">
            OiTesla
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openModal("login")}
            className="text-xs font-bold border-border h-8 px-3 rounded-lg cursor-pointer"
          >
            Sign In
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => openModal("register")}
            className="text-xs font-bold h-8 px-3 rounded-lg bg-black text-white hover:bg-black-soft cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-900/90 border border-border shadow-xs text-xs font-semibold text-ink">
      <Zap className="size-3.5 text-ink fill-current" />
      <span>Auto Rickshaw Ride Sharing For DHAKA</span>
    </div>
  );
}

function HeroContent() {
  return (
    <div className="flex flex-col gap-3 max-w-lg">
      <HeroBadge />
      <h1 className="text-3xl sm:text-7xl font-extrabold tracking-tight text-ink leading-[1.12]">
        Shared rides for Dhaka&apos;s battery Teslas.
      </h1>
      <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
        Street-smart pooled commuting along fixed routes with guaranteed seats and transparent upfront fares.
      </p>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-border/80 backdrop-blur-md shadow-sm flex items-start gap-4">
      <div className="size-11 rounded-xl bg-surface-subtle border border-border flex items-center justify-center shrink-0 shadow-xs">
        <Icon className="size-5.5 text-ink" />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-ink-secondary mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-7xl">
      <FeaturePill
        icon={Coins}
        title="Share Ride, Save Money"
        description="Split fares dynamically across shared route segments. Save up to 40% compared to solo rides."
      />
      <FeaturePill
        icon={Clock}
        title="Always Available"
        description="High-frequency battery Teslas operating across major Dhaka hubs. Zero surge multipliers, anytime."
      />
      <FeaturePill
        icon={ShieldCheck}
        title="Safe & Secure"
        description="Verified electric three-wheeler fleet, strict 3-passenger seating limit, and guaranteed route navigation."
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hasHydrated = useHydrated();

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;
    const path = user.role === "DRIVER" ? "/driver/dashboard" : "/dashboard";
    router.replace(path);
  }, [hasHydrated, isAuthenticated, user, router]);

  return (
    <div className="min-h-[100dvh] flex flex-col relative">
      <main className="flex-1 relative flex flex-col justify-between overflow-hidden">
        <LandingNavbar />
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-rickshaw.jpg"
            alt="Dhaka battery Tesla electric rickshaw graphic"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center filter contrast-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-white/95 lg:bg-gradient-to-r lg:from-white/98 lg:via-white/90 lg:to-white/35 dark:from-zinc-950/98 dark:via-zinc-950/90 dark:to-zinc-950/35" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <HeroContent />
            </div>

            <div className="lg:col-span-5 w-full max-w-lg">
              <FareEstimatorCard />
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-8 pt-2">
          <FeatureGrid />
        </div>
      </main>

      <AuthModal />
    </div>
  );
}
