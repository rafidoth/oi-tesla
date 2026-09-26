"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchLocationCatalog } from "../api/locations.api";
import type { LocationsCatalogResponse } from "../types/locations.types";

export const LOCATIONS_CATALOG_QUERY_KEY = ["locations", "catalog"] as const;

export function useLocationsQuery(): UseQueryResult<LocationsCatalogResponse, Error> {
  return useQuery({
    queryKey: LOCATIONS_CATALOG_QUERY_KEY,
    queryFn: fetchLocationCatalog,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export default useLocationsQuery;
