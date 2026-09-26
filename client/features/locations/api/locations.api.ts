import apiClient, { baseUrlWrapper } from "@/api/axios";
import type { LocationsCatalogResponse } from "../types/locations.types";


export async function fetchLocationCatalog(): Promise<LocationsCatalogResponse> {
  const url = baseUrlWrapper("/locations");
  const response = await apiClient.get<LocationsCatalogResponse>(url);
  return response.data;
}

export const locationsApi = {
  fetchLocationCatalog,
};

export default locationsApi;
