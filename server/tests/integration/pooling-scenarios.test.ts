import { describe, it, expect, beforeEach } from 'vitest';
import {
  createIntegrationTestEnvironment,
  type IntegrationTestEnvironment,
} from '../fixtures/in-memory-store.js';
import { CAST, CORRIDOR_C1 } from '../fixtures/cast.js';
import type { RideBookingResponseDto } from '../../src/modules/rides/rides.types.js';

describe('End-to-End Pooling Scenarios Integration Test Suite', () => {
  let env: IntegrationTestEnvironment;

  beforeEach(() => {
    env = createIntegrationTestEnvironment();
  });

  describe('Corridor C1 & Distance Engine Verification', () => {
    it('verifies Corridor C1 route topology and segment distances', async () => {
      const bToG = await env.locationsService.getDistance(
        CORRIDOR_C1.locations.BANANI.id,
        CORRIDOR_C1.locations.GULSHAN.id
      );
      expect(bToG).toBe(2000);

      const bToM = await env.locationsService.getDistance(
        CORRIDOR_C1.locations.BANANI.id,
        CORRIDOR_C1.locations.MOHAKHALI.id
      );
      expect(bToM).toBe(5000);
    });

    it('verifies solo fare calculations for Corridor C1 legs', async () => {
      const bToMEstimate = await env.ridesService.calculateEstimate({
        pickupLocationId: CORRIDOR_C1.locations.BANANI.id,
        destLocationId: CORRIDOR_C1.locations.MOHAKHALI.id,
        seats: 1,
      });
      expect(bToMEstimate.distanceM).toBe(5000);
      expect(bToMEstimate.soloFarePaisa).toBe(7000);

      const bToGEstimate = await env.ridesService.calculateEstimate({
        pickupLocationId: CORRIDOR_C1.locations.BANANI.id,
        destLocationId: CORRIDOR_C1.locations.GULSHAN.id,
        seats: 1,
      });
      expect(bToGEstimate.distanceM).toBe(2000);
      expect(bToGEstimate.soloFarePaisa).toBe(4000);
    });
  });

  describe('PRD Section 17 & 18 Sequential Pooling Lifecycle (Tasks 9.1.2 to 9.1.6)', () => {
    let poolAId: string;
    let nusratBooking: RideBookingResponseDto;
    let rafiqBooking: RideBookingResponseDto;
    let shirinBooking: RideBookingResponseDto;
    let tanjimBooking: RideBookingResponseDto;

    it('9.1.2 Scenario 1: Nusrat books solo ride Banani -> Mohakhali', async () => {
      // 1. Nusrat requests Banani -> Mohakhali, 1 seat
      nusratBooking = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: CAST.passengers.nusrat.pickupLocationId, // Banani (2)
        destLocationId: CAST.passengers.nusrat.destLocationId,     // Mohakhali (4)
        seats: CAST.passengers.nusrat.seats,                       // 1
        paymentMethod: 'CASH',
      });

      poolAId = nusratBooking.poolId;

      // Assert: New Pool A created with status 'OPEN'
      expect(nusratBooking.isNewPool).toBe(true);
      const poolA = await env.poolsRepo.findPoolById(poolAId);
      expect(poolA).not.toBeNull();
      expect(poolA!.status).toBe('OPEN');

      // Assert: Occupancy 1/3
      expect(poolA!.occupiedSeats).toBe(1);
      expect(poolA!.capacity).toBe(3);

      // Assert: Nusrat's derived ride status is 'REQUESTED'
      const nusratActiveRide = await env.ridesService.getActiveRide(CAST.passengers.nusrat.id);
      expect(nusratActiveRide).not.toBeNull();
      expect(nusratActiveRide!.status).toBe('REQUESTED');

      // Assert: Nusrat's fare is 7000 paisa (70 BDT solo estimate)
      expect(nusratBooking.estimateFarePaisa).toBe(7000);
      expect(nusratActiveRide!.farePaisa).toBe(7000);
      expect(nusratActiveRide!.originalEstimateFarePaisa).toBe(7000);

      // Assert: Audit events REQUEST_CREATED and POOL_CREATED logged
      const reqEvents = env.store.findEventsByType('REQUEST_CREATED');
      expect(reqEvents.length).toBe(1);
      expect(reqEvents[0].actorId).toBe(CAST.passengers.nusrat.id);
      expect(reqEvents[0].toState).toBe('REQUESTED');
      expect(reqEvents[0].payload).toMatchObject({
        seats: 1,
        pickupLocationId: 2,
        destLocationId: 4,
        estimateFarePaisa: 7000,
      });

      const poolEvents = env.store.findEventsByType('POOL_CREATED');
      expect(poolEvents.length).toBe(1);
      expect(poolEvents[0].poolId).toBe(poolAId);
      expect(poolEvents[0].toState).toBe('OPEN');
      expect(poolEvents[0].payload).toMatchObject({
        capacity: 3,
        pickupLocationId: 2,
      });
    });

    it('9.1.3 Scenario 2: Rafiq books Banani -> Gulshan and joins Pool A', async () => {
      // Re-run Scenario 1 to establish baseline state
      nusratBooking = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: CAST.passengers.nusrat.pickupLocationId,
        destLocationId: CAST.passengers.nusrat.destLocationId,
        seats: CAST.passengers.nusrat.seats,
        paymentMethod: 'CASH',
      });
      poolAId = nusratBooking.poolId;

      // 2. Rafiq requests Banani -> Gulshan, 1 seat
      rafiqBooking = await env.ridesService.requestRide(CAST.passengers.rafiq.id, {
        pickupLocationId: CAST.passengers.rafiq.pickupLocationId, // Banani (2)
        destLocationId: CAST.passengers.rafiq.destLocationId,     // Gulshan (3)
        seats: CAST.passengers.rafiq.seats,                       // 1
        paymentMethod: 'CASH',
      });

      // Assert: Rafiq matched to Pool A
      expect(rafiqBooking.isNewPool).toBe(false);
      expect(rafiqBooking.poolId).toBe(poolAId);

      // Assert: Occupancy becomes 2/3
      const poolA = await env.poolsRepo.findPoolById(poolAId);
      expect(poolA!.occupiedSeats).toBe(2);
      expect(poolA!.capacity).toBe(3);

      // Assert: Fares recompute proportionally with exact balance sum(shares) === 7000
      // Nusrat (5000m leg): 7000 * 5000 / 7000 = 5000 paisa
      // Rafiq (2000m leg): 7000 * 2000 / 7000 = 2000 paisa
      const nusratActiveRide = await env.ridesService.getActiveRide(CAST.passengers.nusrat.id);
      const rafiqActiveRide = await env.ridesService.getActiveRide(CAST.passengers.rafiq.id);

      expect(nusratActiveRide!.farePaisa).toBe(5000);
      expect(rafiqActiveRide!.farePaisa).toBe(2000);
      expect(nusratActiveRide!.farePaisa! + rafiqActiveRide!.farePaisa!).toBe(7000);

      // Assert: Co-passengers visible to each other (D16)
      expect(nusratActiveRide!.pool.coPassengers).toEqual([
        { name: CAST.passengers.rafiq.name, destLocationName: 'Gulshan', seats: 1 },
      ]);
      expect(rafiqActiveRide!.pool.coPassengers).toEqual([
        { name: CAST.passengers.nusrat.name, destLocationName: 'Mohakhali', seats: 1 },
      ]);

      // Assert: Audit events logged (REQUEST_CREATED, RIDE_MATCHED, FARE_RECALCULATED)
      const rafiqReqEvents = env.store.getEvents({
        event: 'REQUEST_CREATED',
        actorId: CAST.passengers.rafiq.id,
      });
      expect(rafiqReqEvents.length).toBe(1);

      const matchedEvents = env.store.getEvents({
        event: 'RIDE_MATCHED',
        poolId: poolAId,
        passengerRideId: rafiqBooking.rideId,
      });
      expect(matchedEvents.length).toBe(1);
      expect(matchedEvents[0].toState).toBe('MATCHED');

      const recalcEvents = env.store.getEvents({
        event: 'FARE_RECALCULATED',
        poolId: poolAId,
      });
      expect(recalcEvents.length).toBeGreaterThanOrEqual(1);
      const latestRecalc = recalcEvents[recalcEvents.length - 1];
      expect(latestRecalc.payload).toMatchObject({
        poolTotal: 7000,
        memberFares: {
          [nusratBooking.rideId]: 5000,
          [rafiqBooking.rideId]: 2000,
        },
      });
    });

    it('9.1.4 Scenario 3: Shirin books Banani -> Gulshan and fills Pool A to capacity (3/3)', async () => {
      // Re-run Scenarios 1 & 2 to establish baseline state
      nusratBooking = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: CAST.passengers.nusrat.pickupLocationId,
        destLocationId: CAST.passengers.nusrat.destLocationId,
        seats: CAST.passengers.nusrat.seats,
        paymentMethod: 'CASH',
      });
      poolAId = nusratBooking.poolId;

      rafiqBooking = await env.ridesService.requestRide(CAST.passengers.rafiq.id, {
        pickupLocationId: CAST.passengers.rafiq.pickupLocationId,
        destLocationId: CAST.passengers.rafiq.destLocationId,
        seats: CAST.passengers.rafiq.seats,
        paymentMethod: 'CASH',
      });

      // 3. Shirin requests Banani -> Gulshan, 1 seat
      shirinBooking = await env.ridesService.requestRide(CAST.passengers.shirin.id, {
        pickupLocationId: CAST.passengers.shirin.pickupLocationId, // Banani (2)
        destLocationId: CAST.passengers.shirin.destLocationId,     // Gulshan (3)
        seats: CAST.passengers.shirin.seats,                       // 1
        paymentMethod: 'CASH',
      });

      // Assert: Shirin matched to Pool A
      expect(shirinBooking.isNewPool).toBe(false);
      expect(shirinBooking.poolId).toBe(poolAId);

      // Assert: Occupancy becomes 3/3 (nominal capacity reached)
      const poolA = await env.poolsRepo.findPoolById(poolAId);
      expect(poolA!.occupiedSeats).toBe(3);
      expect(poolA!.capacity).toBe(3);

      // Assert: Fares recompute proportionally with largest-remainder tie-breaking
      // Total leg distance = 5000 + 2000 + 2000 = 9000m
      // Nusrat raw: 7000 * 5000 / 9000 = 3888.888 -> floor 3888, rem 8000
      // Rafiq raw: 7000 * 2000 / 9000 = 1555.555 -> floor 1555, rem 5000
      // Shirin raw: 7000 * 2000 / 9000 = 1555.555 -> floor 1555, rem 5000
      // Nusrat gets +1 (rem 8000), Rafiq gets +1 (earlier createdAt tie-breaker)
      const nusratActiveRide = await env.ridesService.getActiveRide(CAST.passengers.nusrat.id);
      const rafiqActiveRide = await env.ridesService.getActiveRide(CAST.passengers.rafiq.id);
      const shirinActiveRide = await env.ridesService.getActiveRide(CAST.passengers.shirin.id);

      expect(nusratActiveRide!.farePaisa).toBe(3889);
      expect(rafiqActiveRide!.farePaisa).toBe(1556);
      expect(shirinActiveRide!.farePaisa).toBe(1555);
      expect(
        nusratActiveRide!.farePaisa! +
          rafiqActiveRide!.farePaisa! +
          shirinActiveRide!.farePaisa!
      ).toBe(7000);

      // Assert: Audit events logged
      const shirinReqEvents = env.store.getEvents({
        event: 'REQUEST_CREATED',
        actorId: CAST.passengers.shirin.id,
      });
      expect(shirinReqEvents.length).toBe(1);

      const shirinMatchedEvents = env.store.getEvents({
        event: 'RIDE_MATCHED',
        poolId: poolAId,
        passengerRideId: shirinBooking.rideId,
      });
      expect(shirinMatchedEvents.length).toBe(1);

      const recalcEvents = env.store.getEvents({
        event: 'FARE_RECALCULATED',
        poolId: poolAId,
      });
      const latestRecalc = recalcEvents[recalcEvents.length - 1];
      expect(latestRecalc.payload).toMatchObject({
        poolTotal: 7000,
        memberFares: {
          [nusratBooking.rideId]: 3889,
          [rafiqBooking.rideId]: 1556,
          [shirinBooking.rideId]: 1555,
        },
      });
    });

    it('9.1.5 Scenario 4: Tanjim requests Banani -> Mohakhali, Pool A is full, new Pool B created', async () => {
      // Re-run Scenarios 1, 2, 3 to establish baseline full pool (3/3)
      nusratBooking = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: CAST.passengers.nusrat.pickupLocationId,
        destLocationId: CAST.passengers.nusrat.destLocationId,
        seats: CAST.passengers.nusrat.seats,
        paymentMethod: 'CASH',
      });
      poolAId = nusratBooking.poolId;

      rafiqBooking = await env.ridesService.requestRide(CAST.passengers.rafiq.id, {
        pickupLocationId: CAST.passengers.rafiq.pickupLocationId,
        destLocationId: CAST.passengers.rafiq.destLocationId,
        seats: CAST.passengers.rafiq.seats,
        paymentMethod: 'CASH',
      });

      shirinBooking = await env.ridesService.requestRide(CAST.passengers.shirin.id, {
        pickupLocationId: CAST.passengers.shirin.pickupLocationId,
        destLocationId: CAST.passengers.shirin.destLocationId,
        seats: CAST.passengers.shirin.seats,
        paymentMethod: 'CASH',
      });

      // 4. Tanjim requests Banani -> Mohakhali, 1 seat
      tanjimBooking = await env.ridesService.requestRide(CAST.passengers.tanjim.id, {
        pickupLocationId: CAST.passengers.tanjim.pickupLocationId, // Banani (2)
        destLocationId: CAST.passengers.tanjim.destLocationId,     // Mohakhali (4)
        seats: CAST.passengers.tanjim.seats,                       // 1
        paymentMethod: 'CASH',
      });

      // Assert: Pool A is full (3/3), so Tanjim CANNOT join Pool A
      expect(tanjimBooking.poolId).not.toBe(poolAId);

      // Assert: Pool A remains intact at 3/3 with existing riders unaffected
      const poolA = await env.poolsRepo.findPoolById(poolAId);
      expect(poolA!.occupiedSeats).toBe(3);
      expect(poolA!.capacity).toBe(3);

      const nusratActive = await env.ridesService.getActiveRide(CAST.passengers.nusrat.id);
      const rafiqActive = await env.ridesService.getActiveRide(CAST.passengers.rafiq.id);
      const shirinActive = await env.ridesService.getActiveRide(CAST.passengers.shirin.id);
      expect(nusratActive!.farePaisa).toBe(3889);
      expect(rafiqActive!.farePaisa).toBe(1556);
      expect(shirinActive!.farePaisa).toBe(1555);

      // Assert: A new Pool B is created with status 'OPEN', occupied_seats = 1/3
      expect(tanjimBooking.isNewPool).toBe(true);
      const poolB = await env.poolsRepo.findPoolById(tanjimBooking.poolId);
      expect(poolB).not.toBeNull();
      expect(poolB!.status).toBe('OPEN');
      expect(poolB!.occupiedSeats).toBe(1);
      expect(poolB!.capacity).toBe(3);

      // Assert: Tanjim is assigned to Pool B with solo fare 7000 paisa
      const tanjimActive = await env.ridesService.getActiveRide(CAST.passengers.tanjim.id);
      expect(tanjimActive).not.toBeNull();
      expect(tanjimActive!.pool.id).toBe(poolB!.id);
      expect(tanjimActive!.farePaisa).toBe(7000);
      expect(tanjimActive!.status).toBe('REQUESTED');
    });

    it('9.1.6 Scenario 5: Shirin cancels ride in Pool A, occupancy decrements to 2/3, fares recompute', async () => {
      // Re-run Scenarios 1, 2, 3 to establish baseline state
      nusratBooking = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: CAST.passengers.nusrat.pickupLocationId,
        destLocationId: CAST.passengers.nusrat.destLocationId,
        seats: CAST.passengers.nusrat.seats,
        paymentMethod: 'CASH',
      });
      poolAId = nusratBooking.poolId;

      rafiqBooking = await env.ridesService.requestRide(CAST.passengers.rafiq.id, {
        pickupLocationId: CAST.passengers.rafiq.pickupLocationId,
        destLocationId: CAST.passengers.rafiq.destLocationId,
        seats: CAST.passengers.rafiq.seats,
        paymentMethod: 'CASH',
      });

      shirinBooking = await env.ridesService.requestRide(CAST.passengers.shirin.id, {
        pickupLocationId: CAST.passengers.shirin.pickupLocationId,
        destLocationId: CAST.passengers.shirin.destLocationId,
        seats: CAST.passengers.shirin.seats,
        paymentMethod: 'CASH',
      });

      // 5. Shirin cancels her ride in Pool A
      const cancelResponse = await env.ridesService.cancelRide(
        shirinBooking.rideId,
        CAST.passengers.shirin.id,
        { reason: 'Changed mind' }
      );

      // Assert: Shirin's ride status becomes 'CANCELLED'
      expect(cancelResponse.status).toBe('CANCELLED');
      expect(cancelResponse.seatsReleased).toBe(1);

      const shirinRideDetails = await env.ridesService.getRideById(
        shirinBooking.rideId,
        CAST.passengers.shirin.id
      );
      expect(shirinRideDetails.status).toBe('CANCELLED');
      expect(shirinRideDetails.cancelledAt).not.toBeNull();
      expect(shirinRideDetails.isCancellable).toBe(false);

      // Shirin should no longer have an active ride
      const shirinActiveRide = await env.ridesService.getActiveRide(CAST.passengers.shirin.id);
      expect(shirinActiveRide).toBeNull();

      // Assert: Pool A occupancy decrements from 3/3 to 2/3
      const poolA = await env.poolsRepo.findPoolById(poolAId);
      expect(poolA!.occupiedSeats).toBe(2);
      expect(poolA!.capacity).toBe(3);
      expect(cancelResponse.poolRemainingMembers).toBe(2);

      // Assert: Pool A remains 'OPEN' (active members remain)
      expect(poolA!.status).toBe('OPEN');
      expect(cancelResponse.poolStatus).toBe('OPEN');

      // Assert: Fares for remaining members in Pool A automatically recompute:
      // Nusrat fare adjusts from 3889 to 5000 paisa
      // Rafiq fare adjusts from 1556 to 2000 paisa
      // Sum = 5000 + 2000 = 7000 paisa
      const nusratActiveRide = await env.ridesService.getActiveRide(CAST.passengers.nusrat.id);
      const rafiqActiveRide = await env.ridesService.getActiveRide(CAST.passengers.rafiq.id);

      expect(nusratActiveRide!.farePaisa).toBe(5000);
      expect(rafiqActiveRide!.farePaisa).toBe(2000);
      expect(nusratActiveRide!.farePaisa! + rafiqActiveRide!.farePaisa!).toBe(7000);

      // Assert: Audit events RIDE_CANCELLED and FARE_RECALCULATED logged
      const cancelEvents = env.store.getEvents({
        event: 'RIDE_CANCELLED',
        passengerRideId: shirinBooking.rideId,
      });
      expect(cancelEvents.length).toBe(1);
      expect(cancelEvents[0].actorId).toBe(CAST.passengers.shirin.id);
      expect(cancelEvents[0].toState).toBe('CANCELLED');
      expect(cancelEvents[0].payload).toMatchObject({
        reason: 'Changed mind',
        seatsReleased: 1,
      });

      const recalcEvents = env.store.getEvents({
        event: 'FARE_RECALCULATED',
        poolId: poolAId,
      });
      const latestRecalc = recalcEvents[recalcEvents.length - 1];
      expect(latestRecalc.payload).toMatchObject({
        poolTotal: 7000,
        memberFares: {
          [nusratBooking.rideId]: 5000,
          [rafiqBooking.rideId]: 2000,
        },
      });
    });

    it('executes full continuous PRD Section 17 & 18 end-to-end sequence in a single flow', async () => {
      // --- Step 1: Nusrat requests solo B->M ---
      const nusrat = await env.ridesService.requestRide(CAST.passengers.nusrat.id, {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
        paymentMethod: 'CASH',
      });
      expect(nusrat.isNewPool).toBe(true);
      const pAId = nusrat.poolId;

      let pA = (await env.poolsRepo.findPoolById(pAId))!;
      expect(pA.status).toBe('OPEN');
      expect(pA.occupiedSeats).toBe(1);

      let nusratActive = (await env.ridesService.getActiveRide(CAST.passengers.nusrat.id))!;
      expect(nusratActive.status).toBe('REQUESTED');
      expect(nusratActive.farePaisa).toBe(7000);

      // --- Step 2: Rafiq joins B->G ---
      const rafiq = await env.ridesService.requestRide(CAST.passengers.rafiq.id, {
        pickupLocationId: 2,
        destLocationId: 3,
        seats: 1,
        paymentMethod: 'CASH',
      });
      expect(rafiq.isNewPool).toBe(false);
      expect(rafiq.poolId).toBe(pAId);

      pA = (await env.poolsRepo.findPoolById(pAId))!;
      expect(pA.occupiedSeats).toBe(2);

      nusratActive = (await env.ridesService.getActiveRide(CAST.passengers.nusrat.id))!;
      let rafiqActive = (await env.ridesService.getActiveRide(CAST.passengers.rafiq.id))!;
      expect(nusratActive.farePaisa).toBe(5000);
      expect(rafiqActive.farePaisa).toBe(2000);
      expect(nusratActive.farePaisa! + rafiqActive.farePaisa!).toBe(7000);

      // --- Step 3: Shirin joins B->G ---
      const shirin = await env.ridesService.requestRide(CAST.passengers.shirin.id, {
        pickupLocationId: 2,
        destLocationId: 3,
        seats: 1,
        paymentMethod: 'CASH',
      });
      expect(shirin.isNewPool).toBe(false);
      expect(shirin.poolId).toBe(pAId);

      pA = (await env.poolsRepo.findPoolById(pAId))!;
      expect(pA.occupiedSeats).toBe(3);

      nusratActive = (await env.ridesService.getActiveRide(CAST.passengers.nusrat.id))!;
      rafiqActive = (await env.ridesService.getActiveRide(CAST.passengers.rafiq.id))!;
      let shirinActive = (await env.ridesService.getActiveRide(CAST.passengers.shirin.id))!;
      expect(nusratActive.farePaisa).toBe(3889);
      expect(rafiqActive.farePaisa).toBe(1556);
      expect(shirinActive.farePaisa).toBe(1555);
      expect(
        nusratActive.farePaisa! + rafiqActive.farePaisa! + shirinActive.farePaisa!
      ).toBe(7000);

      // --- Step 4: Tanjim requests B->M (Pool A full -> Pool B created) ---
      const tanjim = await env.ridesService.requestRide(CAST.passengers.tanjim.id, {
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
        paymentMethod: 'CASH',
      });
      expect(tanjim.isNewPool).toBe(true);
      expect(tanjim.poolId).not.toBe(pAId);

      pA = (await env.poolsRepo.findPoolById(pAId))!;
      expect(pA.occupiedSeats).toBe(3);

      const pB = (await env.poolsRepo.findPoolById(tanjim.poolId))!;
      expect(pB.status).toBe('OPEN');
      expect(pB.occupiedSeats).toBe(1);

      const tanjimActive = (await env.ridesService.getActiveRide(CAST.passengers.tanjim.id))!;
      expect(tanjimActive.farePaisa).toBe(7000);
      expect(tanjimActive.status).toBe('REQUESTED');

      // --- Step 5: Shirin cancels ride in Pool A ---
      const cancelRes = await env.ridesService.cancelRide(
        shirin.rideId,
        CAST.passengers.shirin.id,
        { reason: 'Trip plan modified' }
      );
      expect(cancelRes.status).toBe('CANCELLED');
      expect(cancelRes.seatsReleased).toBe(1);
      expect(cancelRes.poolRemainingMembers).toBe(2);

      pA = (await env.poolsRepo.findPoolById(pAId))!;
      expect(pA.occupiedSeats).toBe(2);
      expect(pA.status).toBe('OPEN');

      nusratActive = (await env.ridesService.getActiveRide(CAST.passengers.nusrat.id))!;
      rafiqActive = (await env.ridesService.getActiveRide(CAST.passengers.rafiq.id))!;
      expect(nusratActive.farePaisa).toBe(5000);
      expect(rafiqActive.farePaisa).toBe(2000);
      expect(nusratActive.farePaisa! + rafiqActive.farePaisa!).toBe(7000);

      const shirinHistorical = await env.ridesService.getRideById(
        shirin.rideId,
        CAST.passengers.shirin.id
      );
      expect(shirinHistorical.status).toBe('CANCELLED');
      expect(await env.ridesService.getActiveRide(CAST.passengers.shirin.id)).toBeNull();
    });
  });
});
