import type { OpenPoolDestinationStop } from "../../types/driver.types";

export function formatTripDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} • ${timePart}`;
}

export function formatFareBDT(paisa: number): string {
  return `৳${Math.round(paisa / 100)}`;
}

export function formatDestinationSummary(stops: OpenPoolDestinationStop[]): string {
  if (!stops || stops.length === 0) return "Destination";
  if (stops.length === 1) return stops[0].locationName;
  return `${stops[0].locationName} +${stops.length - 1} more`;
}
