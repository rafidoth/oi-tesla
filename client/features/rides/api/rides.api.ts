import apiClient, { baseUrlWrapper } from "@/api/axios";
import type {
  RequestRideDto,
  EstimateResponseDto,
  CreateRideDto,
  RideBookingResponseDto,
  ActiveRideDetailsDto,
  CancelRideDto,
  CancelRideResponseDto,
  PayRideResponseDto,
} from "../types/rides.types";

export async function fetchFareEstimate(
  payload: RequestRideDto
): Promise<EstimateResponseDto> {
  const endpoint = "/rides/estimate";
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.post<EstimateResponseDto>(url, payload);
  return response.data;
}

export async function createRide(
  payload: CreateRideDto
): Promise<RideBookingResponseDto> {
  const endpoint = "/rides";
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.post<RideBookingResponseDto>(url, payload);
  return response.data;
}


export async function fetchActiveRide(): Promise<ActiveRideDetailsDto | null> {
  const endpoint = "/rides/active";
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.get<ActiveRideDetailsDto | null>(url);
  return response.data;
}


export async function fetchRideById(id: string): Promise<ActiveRideDetailsDto> {
  const endpoint = `/rides/${id}`;
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.get<ActiveRideDetailsDto>(url);
  return response.data;
}

export async function cancelRide(
  rideId: string,
  payload?: CancelRideDto
): Promise<CancelRideResponseDto> {
  const endpoint = `/rides/${rideId}/cancel`;
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.post<CancelRideResponseDto>(url, payload ?? {});
  return response.data;
}

export async function payTeslaPayRide(
  rideId: string
): Promise<PayRideResponseDto> {
  const endpoint = `/rides/${rideId}/pay`;
  const url = baseUrlWrapper(endpoint);
  const response = await apiClient.post<PayRideResponseDto>(url);
  return response.data;
}

export const ridesApi = {
  fetchFareEstimate,
  createRide,
  fetchActiveRide,
  fetchRideById,
  cancelRide,
  payTeslaPayRide,
};

export default ridesApi;
