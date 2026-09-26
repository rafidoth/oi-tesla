"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AlertCircle, Car, Loader2, User as UserIcon, Zap } from "lucide-react";
import { useRegisterMutation } from "../hooks/use-register-mutation";
import type { UserRole } from "../types/auth.types";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  vehicleName?: string;
  vehicleRegNo?: string;
  vehicleCapacity?: string;
}

export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();

  const [role, setRole] = useState<UserRole>("PASSENGER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleRegNo, setVehicleRegNo] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState(3);

  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (role === "DRIVER") {
      if (!vehicleName.trim()) {
        newErrors.vehicleName = "Vehicle model / name is required";
      }
      if (!vehicleRegNo.trim()) {
        newErrors.vehicleRegNo = "Registration number is required";
      }
      if (!vehicleCapacity || vehicleCapacity < 1 || vehicleCapacity > 6) {
        newErrors.vehicleCapacity = "Capacity must be between 1 and 6 seats";
      }
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
      await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        vehicle:
          role === "DRIVER"
            ? {
                name: vehicleName.trim(),
                regNo: vehicleRegNo.trim(),
                capacity: Number(vehicleCapacity),
              }
            : undefined,
      });

      router.push("/login?registered=true");
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const message =
        axiosError.response?.data?.error?.message ||
        axiosError.message ||
        "Registration failed. Please check your information.";
      setGeneralError(message);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-none border-border/80 bg-white">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center items-center gap-2 text-primary font-heading font-bold text-xl tracking-tight">
          <Zap className="size-5 fill-primary" />
          <span>OiTesla</span>
        </div>
        <CardTitle className="font-heading text-2xl font-bold tracking-tight text-ink">
          Create your account
        </CardTitle>
        <CardDescription className="text-ink-secondary text-sm">
          Join Dhaka&apos;s battery-run electric pooling network
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General error banner */}
          {generalError && (
            <div className="p-3 rounded-[var(--radius-md)] bg-accent-red-surface text-accent-red border border-accent-red/20 flex items-start gap-2.5 text-sm font-medium">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Role selection toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-ink">Account Type</Label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-subtle rounded-[var(--radius-md)]">
              <button
                type="button"
                onClick={() => {
                  setRole("PASSENGER");
                  setErrors((prev) => ({
                    ...prev,
                    vehicleName: undefined,
                    vehicleRegNo: undefined,
                    vehicleCapacity: undefined,
                  }));
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                  role === "PASSENGER"
                    ? "bg-surface text-ink shadow-sm border border-border/80"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <UserIcon className="size-4" />
                <span>Passenger</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("DRIVER")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[var(--radius-sm)] text-sm font-medium transition-all ${
                  role === "DRIVER"
                    ? "bg-surface text-ink shadow-sm border border-border/80"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                <Car className="size-4" />
                <span>Driver</span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-ink">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Nusrat Jahan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              disabled={registerMutation.isPending}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-accent-red font-medium mt-1">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-semibold text-ink">
              Email Address
            </Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={registerMutation.isPending}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-accent-red font-medium mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-semibold text-ink">
              Password (min. 8 characters)
            </Label>
            <Input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={registerMutation.isPending}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-accent-red font-medium mt-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Dynamic Vehicle Fields (DRIVER ONLY) */}
          {role === "DRIVER" && (
            <div className="space-y-3 pt-3 border-t border-surface-subtle transition-all">
              <div className="flex items-center gap-2">
                <Car className="size-4 text-primary" />
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Vehicle Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="vehicleName"
                    className="text-xs font-semibold text-ink"
                  >
                    Vehicle Name / Model
                  </Label>
                  <Input
                    id="vehicleName"
                    type="text"
                    placeholder="e.g. Bullet"
                    value={vehicleName}
                    onChange={(e) => {
                      setVehicleName(e.target.value);
                      if (errors.vehicleName)
                        setErrors((prev) => ({ ...prev, vehicleName: undefined }));
                    }}
                    disabled={registerMutation.isPending}
                    aria-invalid={!!errors.vehicleName}
                  />
                  {errors.vehicleName && (
                    <p className="text-xs text-accent-red font-medium mt-1">
                      {errors.vehicleName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="vehicleRegNo"
                    className="text-xs font-semibold text-ink"
                  >
                    Registration Number
                  </Label>
                  <Input
                    id="vehicleRegNo"
                    type="text"
                    placeholder="DHA-SHA-11-2233"
                    value={vehicleRegNo}
                    onChange={(e) => {
                      setVehicleRegNo(e.target.value);
                      if (errors.vehicleRegNo)
                        setErrors((prev) => ({
                          ...prev,
                          vehicleRegNo: undefined,
                        }));
                    }}
                    disabled={registerMutation.isPending}
                    aria-invalid={!!errors.vehicleRegNo}
                  />
                  {errors.vehicleRegNo && (
                    <p className="text-xs text-accent-red font-medium mt-1">
                      {errors.vehicleRegNo}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="vehicleCapacity"
                  className="text-xs font-semibold text-ink"
                >
                  Seating Capacity (Max Seats)
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="vehicleCapacity"
                    type="number"
                    min={1}
                    max={6}
                    value={vehicleCapacity}
                    onChange={(e) => {
                      setVehicleCapacity(Number(e.target.value));
                      if (errors.vehicleCapacity)
                        setErrors((prev) => ({
                          ...prev,
                          vehicleCapacity: undefined,
                        }));
                    }}
                    disabled={registerMutation.isPending}
                    className="w-24 tabular-nums"
                    aria-invalid={!!errors.vehicleCapacity}
                  />
                  <span className="text-xs text-ink-secondary">
                    Default 3 for standard electric three-wheelers (1–6 seats)
                  </span>
                </div>
                {errors.vehicleCapacity && (
                  <p className="text-xs text-accent-red font-medium mt-1">
                    {errors.vehicleCapacity}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full mt-4 font-medium"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              `Register as ${role === "PASSENGER" ? "Passenger" : "Driver"}`
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-surface-subtle pt-4">
        <p className="text-sm text-ink-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-primary-strong transition-colors"
          >
            Log in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default RegisterForm;
