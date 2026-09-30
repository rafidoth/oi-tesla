import crypto from 'node:crypto';
import { NOMINAL_POOL_CAPACITY } from '../../src/config/constants.js';
import type { PoolRow, ActiveMemberLegLocation } from '../../src/modules/pools/pools.repository.js';
import type { CandidatePoolData } from '../../src/modules/pools/domain/MatchingEngine.js';
import type {
  ActiveRideRecord,
  PassengerRideRow,
  RideRequestRow,
  CoPassengerRow,
} from '../../src/modules/rides/rides.repository.js';
import type { RouteWithStops } from '../../src/modules/locations/locations.repository.js';
import type { Location, RouteSegment } from '../../src/db/schema/index.js';
import type { RideEvent, NewRideEvent } from '../../src/db/schema/events.js';
import { CAST, CORRIDOR_C1 } from './cast.js';
import { LocationsService } from '../../src/modules/locations/locations.service.js';
import { FareCalculator } from '../../src/modules/pools/domain/FareCalculator.js';
import { SeatGuard } from '../../src/modules/pools/domain/SeatGuard.js';
import { EventsService } from '../../src/modules/events/events.service.js';
import { PoolsService } from '../../src/modules/pools/pools.service.js';
import { RidesService } from '../../src/modules/rides/rides.service.js';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'PASSENGER' | 'DRIVER';
}

export interface VehicleRecord {
  id: string;
  driverId: string;
  name: string;
  regNo: string;
  capacity: number;
  status: string;
}

export class InMemoryStore {
  public locations = new Map<number, Location>();
  public routes: RouteWithStops[] = [];
  public segments: RouteSegment[] = [];
  public users = new Map<string, UserRecord>();
  public vehicles = new Map<string, VehicleRecord>();

  public pools = new Map<string, PoolRow>();
  public rideRequests = new Map<string, RideRequestRow>();
  public passengerRides = new Map<string, PassengerRideRow>();
  public payments = new Map<string, any>();
  public events: RideEvent[] = [];

  private currentTimestampMs = new Date('2026-09-26T08:00:00.000Z').getTime();

  constructor() {
    this.seedDefaults();
  }

  public nextTimestamp(): Date {
    this.currentTimestampMs += 1000;
    return new Date(this.currentTimestampMs);
  }

  public seedDefaults(): void {
    // Seed locations from CORRIDOR_C1
    this.locations.set(2, {
      id: 2,
      name: 'Banani',
      lat: '23.793700',
      lng: '90.406600',
    });
    this.locations.set(3, {
      id: 3,
      name: 'Gulshan',
      lat: '23.792500',
      lng: '90.415200',
    });
    this.locations.set(4, {
      id: 4,
      name: 'Mohakhali',
      lat: '23.777600',
      lng: '90.405400',
    });

    // Seed Route C1 with stops
    this.routes = [
      {
        id: CORRIDOR_C1.route.id,
        code: CORRIDOR_C1.route.code,
        name: CORRIDOR_C1.route.name,
        stops: CORRIDOR_C1.stops.map((s) => ({
          routeId: s.routeId,
          locationId: s.locationId,
          position: s.position,
        })),
      },
    ];

    // Seed Route C1 segments
    this.segments = CORRIDOR_C1.segments.map((seg) => ({
      routeId: seg.routeId,
      fromLocationId: seg.fromLocationId,
      toLocationId: seg.toLocationId,
      distanceM: seg.distanceM,
    }));

    // Seed Demo Users from CAST
    this.users.set(CAST.driver.id, {
      id: CAST.driver.id,
      name: CAST.driver.name,
      email: CAST.driver.email,
      role: CAST.driver.role,
    });
    this.vehicles.set(CAST.driver.vehicle.id, {
      id: CAST.driver.vehicle.id,
      driverId: CAST.driver.id,
      name: CAST.driver.vehicle.name,
      regNo: CAST.driver.vehicle.regNo,
      capacity: CAST.driver.vehicle.capacity,
      status: CAST.driver.vehicle.status,
    });

    for (const passenger of Object.values(CAST.passengers)) {
      this.users.set(passenger.id, {
        id: passenger.id,
        name: passenger.name,
        email: passenger.email,
        role: passenger.role,
      });
    }
  }

  public reset(): void {
    this.pools.clear();
    this.rideRequests.clear();
    this.passengerRides.clear();
    this.events = [];
    this.currentTimestampMs = new Date('2026-09-26T08:00:00.000Z').getTime();
  }

  public getEvents(filter?: Partial<RideEvent>): RideEvent[] {
    if (!filter) return [...this.events];
    return this.events.filter((ev) =>
      Object.entries(filter).every(([key, val]) => (ev as any)[key] === val)
    );
  }

  public findEventsByType(eventType: string): RideEvent[] {
    return this.events.filter((ev) => ev.event === eventType);
  }
}

export class InMemoryLocationsRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findAllLocations(): Promise<Location[]> {
    return Array.from(this.store.locations.values());
  }

  async findAllRoutesWithStops(): Promise<RouteWithStops[]> {
    return this.store.routes;
  }

  async findAllRouteSegments(): Promise<RouteSegment[]> {
    return this.store.segments;
  }
}

export class InMemoryPoolsRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findCandidatePools(
    pickupLocationId: number,
    requiredSeats: number,
    _tx?: any
  ): Promise<CandidatePoolData[]> {
    const candidates: CandidatePoolData[] = [];

    for (const pool of this.store.pools.values()) {
      if (
        ['OPEN', 'MATCHED'].includes(pool.status) &&
        pool.pickupLocationId === pickupLocationId &&
        pool.occupiedSeats + requiredSeats <= pool.capacity
      ) {
        const memberDestLocationIds: number[] = [];
        for (const ride of this.store.passengerRides.values()) {
          if (ride.poolId === pool.id && ride.cancelledAt === null) {
            const req = this.store.rideRequests.get(ride.rideRequestId);
            if (req) {
              memberDestLocationIds.push(req.destLocationId);
            }
          }
        }

        candidates.push({
          id: pool.id,
          pickupLocationId: pool.pickupLocationId,
          occupiedSeats: pool.occupiedSeats,
          capacity: pool.capacity,
          status: pool.status,
          driverId: pool.driverId,
          vehicleId: pool.vehicleId,
          createdAt: pool.createdAt,
          updatedAt: pool.updatedAt,
          memberDestLocationIds,
        });
      }
    }

    candidates.sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

    return candidates;
  }

  async createPool(
    data: { pickupLocationId: number; capacity?: number },
    _tx?: any
  ): Promise<PoolRow> {
    const id = crypto.randomUUID();
    const now = this.store.nextTimestamp();
    const row: PoolRow = {
      id,
      pickupLocationId: data.pickupLocationId,
      capacity: data.capacity ?? NOMINAL_POOL_CAPACITY,
      status: 'OPEN',
      occupiedSeats: 0,
      driverId: null,
      vehicleId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.pools.set(id, row);
    return row;
  }

  async findPoolById(id: string, _tx?: any): Promise<PoolRow | null> {
    return this.store.pools.get(id) ?? null;
  }

  async findActiveMembersWithLegLocations(
    poolId: string,
    _tx?: any
  ): Promise<ActiveMemberLegLocation[]> {
    const active: ActiveMemberLegLocation[] = [];

    for (const ride of this.store.passengerRides.values()) {
      if (ride.poolId === poolId && ride.cancelledAt === null) {
        const req = this.store.rideRequests.get(ride.rideRequestId);
        if (req) {
          active.push({
            passengerRideId: ride.id,
            passengerId: ride.passengerId,
            pickupLocationId: req.pickupLocationId,
            destLocationId: req.destLocationId,
            createdAt: ride.createdAt,
            currentFarePaisa: ride.farePaisa,
          });
        }
      }
    }

    active.sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime();
      if (diff !== 0) return diff;
      return a.passengerRideId.localeCompare(b.passengerRideId);
    });

    return active;
  }

  async updateMemberFares(
    updates: Array<{ passengerRideId: string; farePaisa: number }>,
    _tx?: any
  ): Promise<void> {
    for (const update of updates) {
      const ride = this.store.passengerRides.get(update.passengerRideId);
      if (ride) {
        ride.farePaisa = update.farePaisa;
        ride.updatedAt = this.store.nextTimestamp();
      }
    }
  }

  async incrementSeatsGuarded(
    poolId: string,
    seats: number,
    _tx?: any
  ): Promise<boolean> {
    const pool = this.store.pools.get(poolId);
    if (!pool) return false;
    if (!['OPEN', 'MATCHED'].includes(pool.status)) return false;
    if (pool.occupiedSeats + seats > pool.capacity) return false;

    pool.occupiedSeats += seats;
    pool.updatedAt = this.store.nextTimestamp();
    return true;
  }

  async decrementSeatsGuarded(
    poolId: string,
    seats: number,
    _tx?: any
  ): Promise<boolean> {
    const pool = this.store.pools.get(poolId);
    if (!pool) return false;
    if (pool.occupiedSeats - seats < 0) return false;

    pool.occupiedSeats -= seats;
    pool.updatedAt = this.store.nextTimestamp();
    return true;
  }

  async updatePoolStatus(poolId: string, status: string, _tx?: any): Promise<void> {
    const pool = this.store.pools.get(poolId);
    if (pool) {
      pool.status = status;
      pool.updatedAt = this.store.nextTimestamp();
    }
  }
}

export class InMemoryRidesRepository {
  constructor(private readonly store: InMemoryStore) {}

  async findActiveRideByPassengerId(
    passengerId: string,
    _tx?: any
  ): Promise<{ id: string; poolId: string; status: string } | null> {
    for (const ride of this.store.passengerRides.values()) {
      if (ride.passengerId === passengerId && ride.cancelledAt === null) {
        const pool = this.store.pools.get(ride.poolId);
        if (
          pool &&
          ['OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(pool.status)
        ) {
          return {
            id: ride.id,
            poolId: ride.poolId,
            status: pool.status,
          };
        }
      }
    }
    return null;
  }

  async createRideRequest(
    data: {
      passengerId: string;
      pickupLocationId: number;
      destLocationId: number;
      seats: number;
      paymentMethod: string;
      estimateFarePaisa: number;
    },
    _tx?: any
  ): Promise<RideRequestRow> {
    const id = crypto.randomUUID();
    const now = this.store.nextTimestamp();
    const row: RideRequestRow = {
      id,
      passengerId: data.passengerId,
      pickupLocationId: data.pickupLocationId,
      destLocationId: data.destLocationId,
      seats: data.seats,
      paymentMethod: data.paymentMethod,
      estimateFarePaisa: data.estimateFarePaisa,
      createdAt: now,
    };
    this.store.rideRequests.set(id, row);
    return row;
  }

  async createPassengerRide(
    data: {
      rideRequestId: string;
      passengerId: string;
      poolId: string;
      seats: number;
      farePaisa: number;
    },
    _tx?: any
  ): Promise<PassengerRideRow> {
    const id = crypto.randomUUID();
    const now = this.store.nextTimestamp();
    const row: PassengerRideRow = {
      id,
      rideRequestId: data.rideRequestId,
      passengerId: data.passengerId,
      poolId: data.poolId,
      seats: data.seats,
      farePaisa: data.farePaisa,
      cancelledAt: null,
      cancelReason: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.passengerRides.set(id, row);
    return row;
  }

  async findRideForCancellation(
    rideId: string,
    passengerId: string,
    _tx?: any
  ): Promise<{
    id: string;
    passengerId: string;
    poolId: string;
    seats: number;
    cancelledAt: Date | null;
    poolStatus: string;
  } | null> {
    const ride = this.store.passengerRides.get(rideId);
    if (!ride || ride.passengerId !== passengerId) return null;
    const pool = this.store.pools.get(ride.poolId);
    return {
      id: ride.id,
      passengerId: ride.passengerId,
      poolId: ride.poolId,
      seats: ride.seats,
      cancelledAt: ride.cancelledAt,
      poolStatus: pool?.status ?? 'UNKNOWN',
    };
  }

  async markRideCancelled(
    rideId: string,
    cancelReason?: string | null,
    _tx?: any
  ): Promise<void> {
    const ride = this.store.passengerRides.get(rideId);
    if (ride) {
      ride.cancelledAt = this.store.nextTimestamp();
      ride.cancelReason = cancelReason ?? null;
      ride.updatedAt = this.store.nextTimestamp();
    }
  }

  async countActivePoolMembers(poolId: string, _tx?: any): Promise<number> {
    let count = 0;
    for (const ride of this.store.passengerRides.values()) {
      if (ride.poolId === poolId && ride.cancelledAt === null) {
        count++;
      }
    }
    return count;
  }

  async findActiveRideDetailsByPassengerId(
    passengerId: string,
    _tx?: any
  ): Promise<ActiveRideRecord | null> {
    for (const ride of this.store.passengerRides.values()) {
      if (ride.passengerId === passengerId && ride.cancelledAt === null) {
        const pool = this.store.pools.get(ride.poolId);
        const payment = this.store.payments.get(ride.id);
        if (
          pool &&
          (['OPEN', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'].includes(pool.status) ||
            (pool.status === 'COMPLETED' && (!payment || payment.status === 'PENDING')))
        ) {
          return this.mapActiveRide(ride, pool);
        }
      }
    }
    return null;
  }

  async findRideDetailsById(
    rideId: string,
    passengerId: string,
    _tx?: any
  ): Promise<ActiveRideRecord | null> {
    const ride = this.store.passengerRides.get(rideId);
    if (!ride || ride.passengerId !== passengerId) return null;
    const pool = this.store.pools.get(ride.poolId);
    if (!pool) return null;
    return this.mapActiveRide(ride, pool);
  }

  async findCoPassengersByPoolId(
    poolId: string,
    excludePassengerId: string,
    _tx?: any
  ): Promise<CoPassengerRow[]> {
    const results: CoPassengerRow[] = [];
    for (const ride of this.store.passengerRides.values()) {
      if (
        ride.poolId === poolId &&
        ride.cancelledAt === null &&
        ride.passengerId !== excludePassengerId
      ) {
        const passenger = this.store.users.get(ride.passengerId);
        const req = this.store.rideRequests.get(ride.rideRequestId);
        const destLoc = req ? this.store.locations.get(req.destLocationId) : null;
        if (passenger && destLoc) {
          results.push({
            name: passenger.name,
            destLocationName: destLoc.name,
            seats: ride.seats,
          });
        }
      }
    }
    return results;
  }

  private mapActiveRide(ride: PassengerRideRow, pool: PoolRow): ActiveRideRecord {
    const req = this.store.rideRequests.get(ride.rideRequestId)!;
    const pickupLoc = this.store.locations.get(req.pickupLocationId)!;
    const destLoc = this.store.locations.get(req.destLocationId)!;
    const driver = pool.driverId ? this.store.users.get(pool.driverId) : null;
    const vehicle = pool.vehicleId ? this.store.vehicles.get(pool.vehicleId) : null;

    return {
      id: ride.id,
      rideRequestId: ride.rideRequestId,
      passengerId: ride.passengerId,
      poolId: ride.poolId,
      seats: ride.seats,
      farePaisa: ride.farePaisa,
      cancelledAt: ride.cancelledAt,
      cancelReason: ride.cancelReason,
      completedAt: ride.completedAt,
      createdAt: ride.createdAt,
      updatedAt: ride.updatedAt,
      originalEstimateFarePaisa: req.estimateFarePaisa,
      paymentMethod: req.paymentMethod,
      paymentStatus: this.store.payments.get(ride.id)?.status ?? null,
      pickupLocation: {
        id: pickupLoc.id,
        name: pickupLoc.name,
        lat: pickupLoc.lat,
        lng: pickupLoc.lng,
      },
      destLocation: {
        id: destLoc.id,
        name: destLoc.name,
        lat: destLoc.lat,
        lng: destLoc.lng,
      },
      pool: {
        id: pool.id,
        status: pool.status,
        capacity: pool.capacity,
        occupiedSeats: pool.occupiedSeats,
      },
      driver: driver ? { name: driver.name } : null,
      vehicle: vehicle
        ? {
            name: vehicle.name,
            regNo: vehicle.regNo,
            capacity: vehicle.capacity,
          }
        : null,
    };
  }
}

export class InMemoryEventsRepository {
  constructor(private readonly store: InMemoryStore) {}

  async createEvent(data: NewRideEvent, _tx?: any): Promise<RideEvent> {
    const event: RideEvent = {
      id: crypto.randomUUID(),
      event: data.event,
      actorType: data.actorType,
      actorId: data.actorId ?? null,
      poolId: data.poolId ?? null,
      passengerRideId: data.passengerRideId ?? null,
      rideRequestId: data.rideRequestId ?? null,
      fromState: data.fromState ?? null,
      toState: data.toState ?? null,
      payload: data.payload ?? null,
      createdAt: this.store.nextTimestamp(),
    };
    this.store.events.push(event);
    return event;
  }
}

export interface IntegrationTestEnvironment {
  store: InMemoryStore;
  locationsRepo: InMemoryLocationsRepository;
  poolsRepo: InMemoryPoolsRepository;
  ridesRepo: InMemoryRidesRepository;
  eventsRepo: InMemoryEventsRepository;
  locationsService: LocationsService;
  fareCalculator: FareCalculator;
  seatGuard: SeatGuard;
  eventsService: EventsService;
  poolsService: PoolsService;
  ridesService: RidesService;
}

export function createIntegrationTestEnvironment(): IntegrationTestEnvironment {
  const store = new InMemoryStore();
  const locationsRepo = new InMemoryLocationsRepository(store);
  const poolsRepo = new InMemoryPoolsRepository(store);
  const ridesRepo = new InMemoryRidesRepository(store);
  const eventsRepo = new InMemoryEventsRepository(store);

  const locationsService = new LocationsService(locationsRepo as any);
  const fareCalculator = new FareCalculator();
  const seatGuard = new SeatGuard(poolsRepo as any);
  const eventsService = new EventsService(eventsRepo as any);

  const poolsService = new PoolsService(
    poolsRepo as any,
    locationsRepo as any,
    seatGuard,
    locationsService,
    eventsService,
    fareCalculator
  );

  const fakeDb = {
    transaction: async <T>(callback: (tx: any) => Promise<T>): Promise<T> => {
      const mockTx = { inTransaction: true };
      return await callback(mockTx);
    },
  };

  const ridesService = new RidesService(
    ridesRepo as any,
    locationsService,
    fareCalculator,
    poolsService,
    eventsService,
    fakeDb as any,
    poolsRepo as any
  );

  return {
    store,
    locationsRepo,
    poolsRepo,
    ridesRepo,
    eventsRepo,
    locationsService,
    fareCalculator,
    seatGuard,
    eventsService,
    poolsService,
    ridesService,
  };
}
