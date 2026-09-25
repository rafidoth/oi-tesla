"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import { useLoginMutation } from "../hooks/use-login-mutation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const expired = searchParams.get("expired");
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    try {
      const data = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      if (returnUrl) {
        router.push(returnUrl);
      } else if (data.user.role === "DRIVER") {
        router.push("/driver/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const message =
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        "Invalid email or password. Please try again.";
      setGeneralError(message);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-none border-border/80 bg-white">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center items-center gap-2 text-primary font-heading font-bold text-xl tracking-tight">
          <Zap className="size-5 fill-primary" />
          <span>OiTesla</span>
        </div>
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-ink">
          Log in to your account
        </CardTitle>
        <CardDescription className="text-ink-secondary text-sm">
          Pooled rides for Dhaka&apos;s electric three-wheelers
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success message on redirect from register */}
          {registered && (
            <div className="p-3 rounded-[var(--radius-md)] bg-accent-green-surface text-accent-green border border-accent-green/30 flex items-start gap-2.5 text-sm">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>Registration successful! Please log in with your credentials.</span>
            </div>
          )}

          {/* Session expired message */}
          {expired && (
            <div className="p-3 rounded-[var(--radius-md)] bg-accent-amber-surface text-ink border border-accent-amber/40 flex items-start gap-2.5 text-sm">
              <AlertCircle className="size-4 text-accent-amber shrink-0 mt-0.5" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {/* General error message */}
          {generalError && (
            <div className="p-3 rounded-[var(--radius-md)] bg-accent-red-surface text-accent-red border border-accent-red/20 flex items-start gap-2.5 text-sm font-medium">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-ink">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={loginMutation.isPending}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-accent-red font-medium mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold text-ink"
              >
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={loginMutation.isPending}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-accent-red font-medium mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full mt-2 font-medium"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-surface-subtle pt-4">
        <p className="text-sm text-ink-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary hover:text-primary-strong transition-colors"
          >
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default LoginForm;
