import { DriverRepository } from './driver.repository.js';
import type { EventsService } from '../events/events.service.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { InvalidTransitionError } from '../../shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { ForbiddenError } from '../../shared/errors/ForbiddenError.js';
import { PoolStateMachine, type PoolStatus, type PoolAction } from '../pools/domain/PoolStateMachine.js';
import type { PoolsService } from '../pools/pools.service.js';
import type { Vehicle, Pool, Payment, NewPayment } from '../../db/schema/index.js';
import type { LogRideEventInput } from '../events/events.types.js';
import type {
  DriverMeResponse,
  UpdateDriverStatusResponse,
  OpenPoolItem,
  DeclinePoolResponse,
  AcceptPoolResponse,
  DriverPoolDetailsResponse,
  OpenPoolDestinationStop,
  DriverPoolRosterMember,
} from './driver.types.js';
import type { DeclinePoolInput } from './driver.schema.js';

export class DriverService {
  constructor(
    private readonly driverRepo: DriverRepository,
    private readonly eventsService: EventsService,
    private readonly poolsService?: PoolsService
  ) {}

  async getDriverMe(driverId: string): Promise<DriverMeResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    const activePool = await this.driverRepo.findActivePoolByDriverId(driverId);

    return {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        role: 'DRIVER',
      },
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        regNo: vehicle.regNo,
        capacity: vehicle.capacity,
        status: vehicle.status as 'ONLINE' | 'OFFLINE',
      },
      activePool: activePool
        ? {
            id: activePool.id,
            pickupLocationId: activePool.pickupLocationId,
            pickupLocationName: activePool.pickupLocationName,
            status: activePool.status,
            capacity: activePool.capacity,
            occupiedSeats: activePool.occupiedSeats,
            createdAt: activePool.createdAt,
            updatedAt: activePool.updatedAt,
          }
        : null,
    };
  }

  async updateDriverStatus(
    driverId: string,
    status: 'ONLINE' | 'OFFLINE'
  ): Promise<UpdateDriverStatusResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const updatedVehicle = await this.driverRepo.updateVehicleStatus(driverId, status);
    if (!updatedVehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    return {
      status: updatedVehicle.status as 'ONLINE' | 'OFFLINE',
      vehicle: {
        id: updatedVehicle.id,
        name: updatedVehicle.name,
        regNo: updatedVehicle.regNo,
        capacity: updatedVehicle.capacity,
        status: updatedVehicle.status as 'ONLINE' | 'OFFLINE',
      },
    };
  }

  async getOpenPoolsForDriver(driverId: string): Promise<OpenPoolItem[]> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    if (vehicle.status !== 'ONLINE') {
      return [];
    }

    return this.driverRepo.findOpenPoolsForDriver(driverId, vehicle.capacity);
  }

  async declinePool(
    driverId: string,
    poolId: string,
    input?: DeclinePoolInput
  ): Promise<DeclinePoolResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const pool = await this.driverRepo.findPoolById(poolId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'OPEN' || pool.driverId !== null) {
      throw new InvalidTransitionError(
        'INVALID_POOL_STATE',
        `Pool cannot be declined in status ${pool.status}`
      );
    }

    const isAlreadyDeclined = await this.driverRepo.hasDriverDeclinedPool(driverId, poolId);
    if (isAlreadyDeclined) {
      return {
        success: true,
        poolId,
      };
    }

    await this.eventsService.logRideEvent({
      event: 'DRIVER_DECLINED',
      actorType: 'DRIVER',
      actorId: driverId,
      poolId,
      fromState: 'OPEN',
      toState: 'OPEN',
      payload: input?.reason ? { reason: input.reason } : undefined,
    });

    return {
      success: true,
      poolId,
    };
  }

  async acceptPool(driverId: string, poolId: string): Promise<AcceptPoolResponse> {
    const vehicle = await this.validateDriverAvailability(driverId);
    await this.validatePoolAvailability(poolId, vehicle.capacity);

    try {
      return await this.driverRepo.withTransaction(async (tx) => {
        const assignedPool = await this.assignPoolToDriver(tx, poolId, driverId, vehicle);
        await this.recordAcceptanceAuditEvents(tx, assignedPool, driverId, vehicle);
        return this.formatAcceptPoolResponse(assignedPool);
      });
    } catch (err: unknown) {
      this.handleAcceptanceError(err);
    }
  }

  async getDriverPoolById(
    driverId: string,
    poolId: string
  ): Promise<DriverPoolDetailsResponse> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const pool = await this.driverRepo.findDriverPoolById(poolId, driverId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    const roster = await this.driverRepo.findActiveRosterForPool(poolId, pool.status);
    const destinationStops = this.extractDestinationStops(roster);

    return {
      id: pool.id,
      pickupLocationId: pool.pickupLocationId,
      pickupLocationName: pool.pickupLocationName,
      status: pool.status,
      capacity: pool.capacity,
      occupiedSeats: pool.occupiedSeats,
      driverId: pool.driverId,
      vehicleId: pool.vehicleId,
      destinationStops,
      roster,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  async arrivePool(
    driverId: string,
    poolId: string
  ): Promise<{ success: boolean; poolId: string; status: PoolStatus }> {
    await this.assertDriverExists(driverId);
    return await this.driverRepo.withTransaction(async (tx) => {
      const pool = await this.findAndValidateDriverPool(poolId, driverId, tx);
      this.assertPoolIsMatched(pool.status);
      await this.executePoolTransition(poolId, 'arrive', driverId, tx, pool.status as PoolStatus);
      await this.recordArrivalAuditEvent(tx, poolId, driverId);
      return { success: true, poolId, status: 'DRIVER_ARRIVED' };
    });
  }

  async startPool(
    driverId: string,
    poolId: string
  ): Promise<{ success: boolean; poolId: string; status: PoolStatus }> {
    await this.assertDriverExists(driverId);
    return await this.driverRepo.withTransaction(async (tx) => {
      const pool = await this.findAndValidateDriverPool(poolId, driverId, tx);
      this.assertPoolIsDriverArrived(pool.status);
      await this.executePoolTransition(poolId, 'start', driverId, tx, pool.status as PoolStatus);
      await this.recordStartAuditEvents(tx, pool, driverId);
      return { success: true, poolId, status: 'STARTED' };
    });
  }

  async completePool(
    driverId: string,
    poolId: string
  ): Promise<{ success: boolean; poolId: string; status: PoolStatus }> {
    await this.assertDriverExists(driverId);
    return await this.driverRepo.withTransaction(async (tx) => {
      const pool = await this.findAndValidateDriverPool(poolId, driverId, tx);
      this.assertPoolIsStarted(pool.status);
      await this.executePoolTransition(poolId, 'complete', driverId, tx, pool.status as PoolStatus);
      await this.settlePoolAndInitializePayments(tx, pool, driverId);
      return { success: true, poolId, status: 'COMPLETED' };
    });
  }

  async transitionPoolLifecycle(
    driverId: string,
    poolId: string,
    action: 'arrive' | 'start' | 'complete'
  ): Promise<{ success: boolean; poolId: string; status: PoolStatus }> {
    await this.assertDriverExists(driverId);
    if (this.poolsService) {
      const result = await this.poolsService.transitionPool(poolId, action, {
        id: driverId,
        role: 'DRIVER',
      });
      return { success: true, poolId: result.poolId, status: result.newStatus };
    }
    const pool = await this.findAndValidateDriverPool(poolId, driverId);
    const nextStatus = PoolStateMachine.getNextStatus(pool.status as PoolStatus, action, 'DRIVER');
    await this.driverRepo.updatePoolStatus(poolId, nextStatus);
    return { success: true, poolId, status: nextStatus };
  }

  private assertPoolIsMatched(status: string): void {
    if (status !== 'MATCHED') {
      throw new InvalidTransitionError(
        'INVALID_STATE_TRANSITION',
        `Cannot mark arrival when pool is in status ${status}`
      );
    }
  }

  private assertPoolIsDriverArrived(status: string): void {
    if (status !== 'DRIVER_ARRIVED') {
      throw new InvalidTransitionError(
        'INVALID_STATE_TRANSITION',
        `Cannot start trip when pool is in status ${status}`
      );
    }
  }

  private assertPoolIsStarted(status: string): void {
    if (status !== 'STARTED') {
      throw new InvalidTransitionError(
        'INVALID_STATE_TRANSITION',
        `Cannot complete trip when pool is in status ${status}`
      );
    }
  }

  private async executePoolTransition(
    poolId: string,
    action: PoolAction,
    driverId: string,
    tx: any,
    currentStatus?: PoolStatus
  ): Promise<void> {
    if (this.poolsService) {
      await this.poolsService.transitionPool(poolId, action, { id: driverId, role: 'DRIVER' }, tx);
      return;
    }
    const nextStatus = currentStatus
      ? PoolStateMachine.getNextStatus(currentStatus, action, 'DRIVER')
      : this.resolveDefaultNextStatus(action);
    await this.driverRepo.updatePoolStatus(poolId, nextStatus, tx);
  }

  private resolveDefaultNextStatus(action: PoolAction): PoolStatus {
    if (action === 'arrive') return 'DRIVER_ARRIVED';
    if (action === 'start') return 'STARTED';
    return 'COMPLETED';
  }

  private async recordStartAuditEvents(
    tx: any,
    pool: Pool,
    driverId: string
  ): Promise<void> {
    const activeMembers = (await this.driverRepo.findActiveMembersByPoolId(pool.id, tx)) || [];
    await this.logPoolStartEvent(tx, pool.id, driverId, activeMembers);
    await this.logMemberStartEvents(tx, pool.id, activeMembers);
  }

  private async logPoolStartEvent(
    tx: any,
    poolId: string,
    driverId: string,
    members: Array<{ id: string; rideRequestId: string; passengerId: string; farePaisa?: number | null }>
  ): Promise<void> {
    await this.eventsService.logRideEvent(
      {
        event: 'RIDE_STARTED',
        actorType: 'DRIVER',
        actorId: driverId,
        poolId,
        fromState: 'DRIVER_ARRIVED',
        toState: 'STARTED',
        payload: {
          startedAt: new Date().toISOString(),
          memberCount: members.length,
        },
      },
      tx
    );
  }

  private async logMemberStartEvents(
    tx: any,
    poolId: string,
    members: Array<{ id: string; rideRequestId: string; passengerId: string; farePaisa?: number | null }>
  ): Promise<void> {
    for (const member of members) {
      await this.eventsService.logRideEvent(
        {
          event: 'RIDE_STARTED',
          actorType: 'SYSTEM',
          actorId: member.passengerId,
          poolId,
          passengerRideId: member.id,
          rideRequestId: member.rideRequestId,
          fromState: 'DRIVER_ARRIVED',
          toState: 'STARTED',
          payload: {
            farePaisa: member.farePaisa ?? null,
          },
        },
        tx
      );
    }
  }

  private async settlePoolAndInitializePayments(
    tx: any,
    pool: Pool,
    driverId: string
  ): Promise<void> {
    const completedAt = new Date();
    const members = await this.driverRepo.findActiveMembersForCompletion(pool.id, tx);
    await this.driverRepo.markPassengerRidesCompleted(pool.id, completedAt, tx);
    const createdPayments = await this.generatePendingPayments(tx, members, completedAt);
    await this.recordCompletionAuditEvents(tx, pool.id, driverId, members, completedAt);
    await this.recordPaymentAuditEvents(tx, pool.id, members, createdPayments, completedAt);
  }

  private async generatePendingPayments(
    tx: any,
    members: Array<{ id: string; farePaisa: number | null; estimateFarePaisa: number; paymentMethod: string }>,
    completedAt: Date
  ): Promise<Payment[]> {
    const records = members.map((m) => this.buildNewPaymentRecord(m, completedAt));
    return this.driverRepo.createPendingPayments(records, tx);
  }

  private buildNewPaymentRecord(
    member: { id: string; farePaisa: number | null; estimateFarePaisa: number; paymentMethod: string },
    completedAt: Date
  ): NewPayment {
    return {
      passengerRideId: member.id,
      method: member.paymentMethod,
      amountPaisa: member.farePaisa ?? member.estimateFarePaisa,
      status: 'PENDING',
      createdAt: completedAt,
      updatedAt: completedAt,
    };
  }

  private async recordCompletionAuditEvents(
    tx: any,
    poolId: string,
    driverId: string,
    members: Array<{ id: string; passengerId: string; rideRequestId: string; farePaisa: number | null; estimateFarePaisa: number }>,
    completedAt: Date
  ): Promise<void> {
    await this.logPoolCompleteEvent(tx, poolId, driverId, members.length, completedAt);
    await this.logMemberCompleteEvents(tx, poolId, members, completedAt);
  }

  private async logPoolCompleteEvent(
    tx: any,
    poolId: string,
    driverId: string,
    memberCount: number,
    completedAt: Date
  ): Promise<void> {
    await this.eventsService.logRideEvent(
      {
        event: 'RIDE_COMPLETED',
        actorType: 'DRIVER',
        actorId: driverId,
        poolId,
        fromState: 'STARTED',
        toState: 'COMPLETED',
        payload: {
          completedAt: completedAt.toISOString(),
          memberCount,
        },
      },
      tx
    );
  }

  private async logMemberCompleteEvents(
    tx: any,
    poolId: string,
    members: Array<{ id: string; passengerId: string; rideRequestId: string; farePaisa: number | null; estimateFarePaisa: number }>,
    completedAt: Date
  ): Promise<void> {
    for (const member of members) {
      await this.eventsService.logRideEvent(this.buildMemberCompleteEvent(poolId, member, completedAt), tx);
    }
  }

  private buildMemberCompleteEvent(
    poolId: string,
    member: { id: string; passengerId: string; rideRequestId: string; farePaisa: number | null; estimateFarePaisa: number },
    completedAt: Date
  ): LogRideEventInput {
    return {
      event: 'RIDE_COMPLETED',
      actorType: 'SYSTEM',
      actorId: member.passengerId,
      poolId,
      passengerRideId: member.id,
      rideRequestId: member.rideRequestId,
      fromState: 'STARTED',
      toState: 'COMPLETED',
      payload: {
        farePaisa: member.farePaisa ?? member.estimateFarePaisa,
        completedAt: completedAt.toISOString(),
      },
    };
  }

  private async recordPaymentAuditEvents(
    tx: any,
    poolId: string,
    members: Array<{ id: string; passengerId: string; rideRequestId: string; farePaisa: number | null; estimateFarePaisa: number; paymentMethod: string }>,
    payments: Payment[],
    completedAt: Date
  ): Promise<void> {
    const paymentMap = new Map(payments.map((p) => [p.passengerRideId, p]));
    for (const member of members) {
      const payment = paymentMap.get(member.id);
      await this.eventsService.logRideEvent(this.buildPaymentPendingEvent(poolId, member, payment, completedAt), tx);
    }
  }

  private buildPaymentPendingEvent(
    poolId: string,
    member: { id: string; passengerId: string; rideRequestId: string; farePaisa: number | null; estimateFarePaisa: number; paymentMethod: string },
    payment: Payment | undefined,
    completedAt: Date
  ): LogRideEventInput {
    return {
      event: 'PAYMENT_PENDING',
      actorType: 'SYSTEM',
      actorId: member.passengerId,
      poolId,
      passengerRideId: member.id,
      rideRequestId: member.rideRequestId,
      payload: {
        paymentId: payment?.id,
        amountPaisa: member.farePaisa ?? member.estimateFarePaisa,
        method: member.paymentMethod,
        status: 'PENDING',
        initializedAt: completedAt.toISOString(),
      },
    };
  }

  private async recordArrivalAuditEvent(
    tx: any,
    poolId: string,
    driverId: string
  ): Promise<void> {
    await this.eventsService.logRideEvent(
      {
        event: 'DRIVER_ARRIVED',
        actorType: 'DRIVER',
        actorId: driverId,
        poolId,
        fromState: 'MATCHED',
        toState: 'DRIVER_ARRIVED',
        payload: {
          arrivedAt: new Date().toISOString(),
        },
      },
      tx
    );
  }

  private async assertDriverExists(driverId: string): Promise<void> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }
  }

  private async findAndValidateDriverPool(poolId: string, driverId: string, tx?: any): Promise<Pool> {
    const pool = await this.driverRepo.findPoolById(poolId, tx);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }
    if (!pool.driverId || pool.driverId !== driverId) {
      throw new ForbiddenError('Driver is not assigned to this pool');
    }
    return pool;
  }

  private extractDestinationStops(roster: DriverPoolRosterMember[]): OpenPoolDestinationStop[] {
    const stopMap = new Map<number, string>();
    for (const member of roster) {
      stopMap.set(member.destLocationId, member.destLocationName);
    }
    return Array.from(stopMap.entries()).map(([locationId, locationName]) => ({
      locationId,
      locationName,
    }));
  }

  private async validateDriverAvailability(driverId: string): Promise<Vehicle> {
    const driver = await this.driverRepo.findDriverById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver profile not found');
    }

    const vehicle = await this.driverRepo.findVehicleByDriverId(driverId);
    if (!vehicle) {
      throw new NotFoundError('No vehicle assigned to driver');
    }

    if (vehicle.status !== 'ONLINE') {
      throw new ConflictError('DRIVER_OFFLINE', 'Driver must be online to accept a pool');
    }

    const activePool = await this.driverRepo.findActivePoolByDriverId(driverId);
    if (activePool) {
      throw new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress');
    }

    return vehicle;
  }

  private async validatePoolAvailability(poolId: string, vehicleCapacity: number): Promise<Pool> {
    const pool = await this.driverRepo.findPoolById(poolId);
    if (!pool) {
      throw new NotFoundError('Pool not found');
    }

    if (pool.status !== 'OPEN' || pool.driverId !== null) {
      throw new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available');
    }

    if (vehicleCapacity < pool.occupiedSeats) {
      throw new ConflictError('VEHICLE_TOO_SMALL', 'Vehicle capacity is less than pool occupied seats', {
        vehicleCapacity,
        occupiedSeats: pool.occupiedSeats,
      });
    }

    return pool;
  }

  private async assignPoolToDriver(
    tx: any,
    poolId: string,
    driverId: string,
    vehicle: Vehicle
  ): Promise<Pool> {
    const updatedPool = await this.driverRepo.assignDriverToPool(
      poolId,
      driverId,
      vehicle.id,
      vehicle.capacity,
      tx
    );

    if (!updatedPool) {
      const latestPool = await this.driverRepo.findPoolById(poolId, tx);
      if (latestPool && latestPool.occupiedSeats > vehicle.capacity) {
        throw new ConflictError('VEHICLE_TOO_SMALL', 'Vehicle capacity is less than pool occupied seats', {
          vehicleCapacity: vehicle.capacity,
          occupiedSeats: latestPool.occupiedSeats,
        });
      }
      throw new ConflictError('POOL_ALREADY_ASSIGNED', 'Pool is already assigned or no longer available');
    }

    return updatedPool;
  }

  private async recordAcceptanceAuditEvents(
    tx: any,
    pool: Pool,
    driverId: string,
    vehicle: Vehicle
  ): Promise<void> {
    const activeMembers = await this.driverRepo.findActiveMembersByPoolId(pool.id, tx);

    await this.eventsService.logRideEvent(
      {
        event: 'DRIVER_ACCEPTED',
        actorType: 'DRIVER',
        actorId: driverId,
        poolId: pool.id,
        fromState: 'OPEN',
        toState: 'MATCHED',
        payload: {
          vehicleId: vehicle.id,
          vehicleCapacity: vehicle.capacity,
          occupiedSeats: pool.occupiedSeats,
        },
      },
      tx
    );

    for (const member of activeMembers) {
      await this.eventsService.logRideEvent(
        {
          event: 'RIDE_MATCHED',
          actorType: 'SYSTEM',
          actorId: member.passengerId,
          poolId: pool.id,
          passengerRideId: member.id,
          rideRequestId: member.rideRequestId,
          fromState: 'REQUESTED',
          toState: 'MATCHED',
        },
        tx
      );
    }
  }

  private formatAcceptPoolResponse(pool: Pool): AcceptPoolResponse {
    return {
      success: true,
      pool: {
        id: pool.id,
        pickupLocationId: pool.pickupLocationId,
        status: pool.status,
        capacity: pool.capacity,
        occupiedSeats: pool.occupiedSeats,
        driverId: pool.driverId!,
        vehicleId: pool.vehicleId!,
        createdAt: pool.createdAt,
        updatedAt: pool.updatedAt,
      },
    };
  }

  private handleAcceptanceError(err: unknown): never {
    const error = err as { code?: string; message?: string };
    if (error?.code === '23505' || error?.message?.includes('pools_driver_active_unique_idx')) {
      throw new ConflictError('DRIVER_HAS_ACTIVE_POOL', 'Driver already has an active pool in progress');
    }
    throw err;
  }
}

export default DriverService;


