"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { RegisterPayload, User } from "../types/auth.types";

export function useRegisterMutation() {
  return useMutation<{ message: string; user: User }, Error, RegisterPayload>({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
  });
}

export default useRegisterMutation;
