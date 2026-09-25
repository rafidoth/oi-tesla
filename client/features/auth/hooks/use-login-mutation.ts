"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { AuthResponse, LoginCredentials } from "../types/auth.types";

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      queryClient.setQueryData(["auth", "me"], { user: data.user });
    },
  });
}

export default useLoginMutation;
