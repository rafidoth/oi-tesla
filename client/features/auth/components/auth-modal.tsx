"use client";

import { useAuthModalStore } from "../store/auth-modal.store";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { cn } from "cn";

function AuthModalHeader() {
  return (
    <DialogHeader className="text-center items-center pb-2">
      <DialogTitle className="sr-only">OiTesla</DialogTitle>
      <div className="flex items-center gap-2 text-ink font-bold text-lg tracking-tight">
        <div className="size-7 rounded bg-black text-white flex items-center justify-center">
          <Zap className="size-4 fill-white text-white" />
        </div>
        <span>OiTesla</span>
      </div>
    </DialogHeader>
  );
}

function AuthTabSwitch({
  mode,
  onSelectMode,
}: {
  mode: "login" | "register";
  onSelectMode: (m: "login" | "register") => void;
}) {
  return (
    <div className="grid grid-cols-2 p-1 bg-surface-subtle border border-border rounded-xl">
      <button
        type="button"
        onClick={() => onSelectMode("login")}
        className={cn(
          "py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer",
          mode === "login"
            ? "bg-white text-ink shadow-xs"
            : "text-ink-secondary hover:text-ink"
        )}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onSelectMode("register")}
        className={cn(
          "py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer",
          mode === "register"
            ? "bg-white text-ink shadow-xs"
            : "text-ink-secondary hover:text-ink"
        )}
      >
        Create Account
      </button>
    </div>
  );
}

export function AuthModal() {
  const { isOpen, mode, role, closeModal, setMode, setRole } =
    useAuthModalStore();

  const isDriverRegister = mode === "register" && role === "DRIVER";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? closeModal() : null)}>
      <DialogContent
        className={cn(
          "w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white rounded-2xl border-border shadow-2xl transition-all duration-200",
          mode === "login"
            ? "sm:max-w-md"
            : isDriverRegister
              ? "sm:max-w-2xl md:max-w-3xl"
              : "sm:max-w-xl md:max-w-2xl"
        )}
        showCloseButton
      >
        <AuthModalHeader />

        <AuthTabSwitch mode={mode} onSelectMode={setMode} />

        <div className="pt-1">
          {mode === "login" ? (
            <LoginForm
              showHeader={false}
              onSuccess={closeModal}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              showHeader={false}
              initialRole={role}
              onRoleChange={setRole}
              onSuccess={() => setMode("login")}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
