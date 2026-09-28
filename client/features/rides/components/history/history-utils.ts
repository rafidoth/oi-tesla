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

export function isPendingTeslaPay(
  paymentMethod: string,
  paymentStatus: string | null
): boolean {
  return paymentMethod === "TESLAPAY" && paymentStatus !== "PAID";
}
