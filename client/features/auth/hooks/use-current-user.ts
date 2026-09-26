"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { User } from "../types/auth.types";

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery<{ user: User }, Error>({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.getCurrentUser(),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.data?.user) {
      setUser(query.data.user);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.isError) {
      logout();
    }
  }, [query.isError, logout]);

  return query;
}

export default useCurrentUser;
