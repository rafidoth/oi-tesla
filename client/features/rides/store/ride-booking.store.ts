import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  PaymentMethod,
  PoolAssignmentDto,
  RideBookingDraft,
} from "../types/rides.types";

export interface RideBookingState extends RideBookingDraft {
  // Actions
  setPickupLocationId: (id: number | null) => void;
  setDestLocationId: (id: number | null) => void;
  setSeats: (seats: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setActiveRideId: (id: string | null) => void;
  setPoolAssignment: (assignment: PoolAssignmentDto | null) => void;
  resetBookingDraft: () => void;
}

export const initialRideBookingDraft: RideBookingDraft = {
  pickupLocationId: null,
  destLocationId: null,
  seats: 1,
  paymentMethod: "CASH",
  activeRideId: null,
  poolAssignment: null,
};

export const useRideBookingStore = create<RideBookingState>()(
  devtools(
    (set) => ({
      ...initialRideBookingDraft,

      setPickupLocationId: (pickupLocationId: number | null) =>
        set({ pickupLocationId }),

      setDestLocationId: (destLocationId: number | null) =>
        set({ destLocationId }),

      setSeats: (seats: number) =>
        set({ seats }),

      setPaymentMethod: (paymentMethod: PaymentMethod) =>
        set({ paymentMethod }),

      setActiveRideId: (activeRideId: string | null) =>
        set({ activeRideId }),

      setPoolAssignment: (poolAssignment: PoolAssignmentDto | null) =>
        set({ poolAssignment }),

      resetBookingDraft: () =>
        set(initialRideBookingDraft),
    }),
    { name: "ride-booking" }
  )
);

export default useRideBookingStore;
