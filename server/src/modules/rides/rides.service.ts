import type { db } from '../../db/client.js';
import type { RidesRepository } from './rides.repository.js';
import type { LocationsService } from '../locations/locations.service.js';
import type { FareCalculator } from '../pools/domain/FareCalculator.js';
import type { PoolsService } from '../pools/pools.service.js';
import { PoolsRepository } from '../pools/pools.repository.js';
import type { EventsService } from '../events/events.service.js';
import { ConflictError } from '../../shared/errors/ConflictError.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { InvalidTransitionError } from '../../shared/errors/InvalidTransitionError.js';
import { ForbiddenError } from '../../shared/errors/ForbiddenError.js';
import { NOMINAL_POOL_CAPACITY } from '../../config/constants.js';
import { Ride } from './domain/Ride.js';
import type { Payment } from '../../db/schema/index.js';
import type {
  RequestRideDto,
  EstimateResponseDto,
  RideBookingResponseDto,
  ActiveRideDetailsDto,
  CancelRideResponseDto,
  PayRideResponseDto,
  PassengerRideHistoryItemDto,
} from './rides.types.js';
import type {
  CreateRideInput,
  CancelRideInput,
  GetPassengerRidesQueryInput,
} from './rides.schema.js';
import type {
  ActiveRideRecord,
  PassengerRideTeslaPaySettlementInfo,
  PassengerRideHistoryRecord,
  CoPassengerRow,
} from './rides.repository.js';

type DbType = typeof db;

export class RidesService {
  private readonly poolsRepo: PoolsRepository;

  constructor(
    private readonly ridesRepo: RidesRepository,
    private readonly locationsService: LocationsService,
    private readonly fareCalculator: FareCalculator,
    private readonly poolsService: PoolsService,
    private readonly eventsService: EventsService,
    private readonly db: DbType,
    poolsRepo?: PoolsRepository
  ) {
    this.poolsRepo = poolsRepo ?? (new PoolsRepository(db) as PoolsRepository);
  }

  async calculateEstimate(dto: RequestRideDto): Promise<EstimateResponseDto> {
    const distanceM = await this.locationsService.getDistance(
      dto.pickupLocationId,
      dto.destLocationId
    );

    const soloFarePaisa = this.fareCalculator.calculateSoloFare(distanceM);

    return {
      pickupLocationId: dto.pickupLocationId,
      destLocationId: dto.destLocationId,
      distanceM,
      seats: dto.seats,
      soloFarePaisa,
      currency: 'BDT',
    };
  }

  async requestRide(
    passengerId: string,
    input: CreateRideInput
  ): Promise<RideBookingResponseDto> {
    return await this.db.transaction(async (tx) => {
      const activeRide = await this.ridesRepo.findActiveRideByPassengerId(passengerId, tx);
      if (activeRide) {
        throw new ConflictError('ACTIVE_RIDE_EXISTS', 'Passenger already has an active ride');
      }

      const distanceM = await this.locationsService.getDistance(
        input.pickupLocationId,
        input.destLocationId
      );
      const estimateFarePaisa = this.fareCalculator.calculateSoloFare(distanceM);

      const rideRequest = await this.ridesRepo.createRideRequest(
        {
          passengerId,
          pickupLocationId: input.pickupLocationId,
          destLocationId: input.destLocationId,
          seats: input.seats,
          paymentMethod: input.paymentMethod,
          estimateFarePaisa,
        },
        tx
      );

      const poolResult = await this.poolsService.joinPoolWithFallback(
        {
          pickupLocationId: input.pickupLocationId,
          destLocationId: input.destLocationId,
          seats: input.seats,
        },
        tx
      );

      // 5. Insert into passenger_rides
      const passengerRide = await this.ridesRepo.createPassengerRide(
        {
          rideRequestId: rideRequest.id,
          passengerId,
          poolId: poolResult.poolId,
          seats: input.seats,
          farePaisa: estimateFarePaisa,
        },
        tx
      );

      // Recalculate pool fares for all active members
      await this.poolsService.recalculatePoolFares(poolResult.poolId, tx);

      // 6. Audit logging
      await this.eventsService.logRideEvent(
        {
          event: 'REQUEST_CREATED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          rideRequestId: rideRequest.id,
          toState: 'REQUESTED',
          payload: {
            seats: input.seats,
            pickupLocationId: input.pickupLocationId,
            destLocationId: input.destLocationId,
            estimateFarePaisa,
          },
        },
        tx
      );

      if (poolResult.isNew) {
        await this.eventsService.logRideEvent(
          {
            event: 'POOL_CREATED',
            actorType: 'SYSTEM',
            poolId: poolResult.poolId,
            toState: 'OPEN',
            payload: {
              capacity: NOMINAL_POOL_CAPACITY,
              pickupLocationId: input.pickupLocationId,
            },
          },
          tx
        );
      } else {
        await this.eventsService.logRideEvent(
          {
            event: 'RIDE_MATCHED',
            actorType: 'SYSTEM',
            poolId: poolResult.poolId,
            passengerRideId: passengerRide.id,
            toState: 'MATCHED',
          },
          tx
        );
      }

      // 7. Return snapshot
      return {
        rideId: passengerRide.id,
        rideRequestId: rideRequest.id,
        poolId: poolResult.poolId,
        status: poolResult.isNew ? 'OPEN' : 'MATCHED',
        seats: input.seats,
        estimateFarePaisa,
        paymentMethod: input.paymentMethod,
        isNewPool: poolResult.isNew,
      };
    });
  }

  async getActiveRide(passengerId: string): Promise<ActiveRideDetailsDto | null> {
    const record = await this.ridesRepo.findActiveRideDetailsByPassengerId(passengerId);
    if (!record) {
      return null;
    }

    const coPassengers = await this.ridesRepo.findCoPassengersByPoolId(
      record.poolId,
      record.passengerId
    );
    return this.formatRideDetails(record, coPassengers);
  }

  async getRideById(rideId: string, passengerId: string): Promise<ActiveRideDetailsDto> {
    const record = await this.ridesRepo.findRideDetailsById(rideId, passengerId);
    if (!record) {
      throw new NotFoundError('RIDE_NOT_FOUND', 'Ride not found');
    }

    const coPassengers = await this.ridesRepo.findCoPassengersByPoolId(
      record.poolId,
      record.passengerId
    );
    return this.formatRideDetails(record, coPassengers);
  }

  async getPassengerRideHistory(
    passengerId: string,
    query?: GetPassengerRidesQueryInput
  ): Promise<PassengerRideHistoryItemDto[]> {
    const records = await this.ridesRepo.findPassengerRideHistory(passengerId, query);
    return records.map((record) => this.mapToPassengerRideHistoryItem(record));
  }

  async cancelRide(
    rideId: string,
    passengerId: string,
    input?: CancelRideInput
  ): Promise<CancelRideResponseDto> {
    return await this.db.transaction(async (tx) => {
      // 1. Query ride via ridesRepo.findRideForCancellation(rideId, passengerId, tx)
      const ride = await this.ridesRepo.findRideForCancellation(rideId, passengerId, tx);
      if (!ride) {
        throw new NotFoundError('RIDE_NOT_FOUND', 'Ride not found');
      }

      // 2. Check already cancelled
      if (ride.cancelledAt !== null) {
        throw new InvalidTransitionError('CANCEL_NOT_PERMITTED', 'Ride is already cancelled');
      }

      // 3. Check pre-driver arrival rule per ADR D10
      if (ride.poolStatus !== 'OPEN' && ride.poolStatus !== 'MATCHED') {
        throw new InvalidTransitionError(
          'CANCEL_NOT_PERMITTED',
          'Ride cannot be cancelled after driver has arrived'
        );
      }

      // 4. Mark ride cancelled
      await this.ridesRepo.markRideCancelled(rideId, input?.reason, tx);

      // 5. Release seats atomically
      await this.poolsRepo.decrementSeatsGuarded(ride.poolId, ride.seats, tx);

      // 6. Count remaining active members
      const remainingMembers = await this.ridesRepo.countActivePoolMembers(ride.poolId, tx);

      // 7. If remainingMembers === 0:
      if (remainingMembers === 0) {
        await this.poolsRepo.updatePoolStatus(ride.poolId, 'CANCELLED', tx);
        await this.eventsService.logRideEvent(
          {
            event: 'POOL_CANCELLED',
            actorType: 'PASSENGER',
            actorId: passengerId,
            poolId: ride.poolId,
            toState: 'CANCELLED',
            payload: { reason: input?.reason, lastMemberRideId: rideId },
          },
          tx
        );
      } else {
        // 8. Else (remainingMembers > 0): recalculate fares for remaining members
        await this.poolsService.recalculatePoolFares(ride.poolId, tx);
      }

      // 9. Log audit event RIDE_CANCELLED
      await this.eventsService.logRideEvent(
        {
          event: 'RIDE_CANCELLED',
          actorType: 'PASSENGER',
          actorId: passengerId,
          passengerRideId: rideId,
          poolId: ride.poolId,
          toState: 'CANCELLED',
          payload: { reason: input?.reason, seatsReleased: ride.seats },
        },
        tx
      );

      // 10. Return CancelRideResponseDto
      return {
        rideId,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: input?.reason ?? null,
        seatsReleased: ride.seats,
        poolRemainingMembers: remainingMembers,
        poolStatus: remainingMembers === 0 ? 'CANCELLED' : ride.poolStatus,
      };
    });
  }

  private formatRideDetails(
    record: ActiveRideRecord,
    coPassengers: CoPassengerRow[] = []
  ): ActiveRideDetailsDto {
    const ride = new Ride({
      id: record.id,
      rideRequestId: record.rideRequestId,
      passengerId: record.passengerId,
      poolId: record.poolId,
      seats: record.seats,
      farePaisa: record.farePaisa,
      cancelledAt: record.cancelledAt,
      cancelReason: record.cancelReason,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      poolStatus: record.pool.status,
    });

    return {
      id: ride.id,
      rideRequestId: ride.rideRequestId,
      passengerId: ride.passengerId,
      status: ride.status,
      seats: ride.seats,
      farePaisa:
        ride.farePaisa !== null && ride.farePaisa !== undefined
          ? ride.farePaisa
          : record.originalEstimateFarePaisa,
      originalEstimateFarePaisa: record.originalEstimateFarePaisa,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus ?? null,
      pickupLocation: {
        id: record.pickupLocation.id,
        name: record.pickupLocation.name,
        lat: Number(record.pickupLocation.lat),
        lng: Number(record.pickupLocation.lng),
      },
      destLocation: {
        id: record.destLocation.id,
        name: record.destLocation.name,
        lat: Number(record.destLocation.lat),
        lng: Number(record.destLocation.lng),
      },
      pool: {
        id: record.pool.id,
        status: record.pool.status,
        capacity: record.pool.capacity,
        occupiedSeats: record.pool.occupiedSeats,
        coPassengers: coPassengers.map((cp) => ({
          name: cp.name,
          destLocationName: cp.destLocationName,
          seats: cp.seats,
        })),
        driver: record.driver ? { name: record.driver.name } : null,
        vehicle: record.vehicle
          ? {
              name: record.vehicle.name,
              regNo: record.vehicle.regNo,
              capacity: record.vehicle.capacity,
            }
          : null,
      },
      isCancellable: ride.isCancellable,
      createdAt: ride.createdAt,
      cancelledAt: ride.cancelledAt,
      completedAt: ride.completedAt,
    };
  }

  private mapToPassengerRideHistoryItem(
    record: PassengerRideHistoryRecord
  ): PassengerRideHistoryItemDto {
    return {
      id: record.id,
      rideRequestId: record.rideRequestId,
      poolId: record.poolId,
      status: this.deriveHistoryStatus(record),
      seats: record.seats,
      farePaisa: this.resolveHistoryFare(record),
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus ?? null,
      pickupLocation: {
        id: record.pickupLocation.id,
        name: record.pickupLocation.name,
        lat: Number(record.pickupLocation.lat),
        lng: Number(record.pickupLocation.lng),
      },
      destLocation: {
        id: record.destLocation.id,
        name: record.destLocation.name,
        lat: Number(record.destLocation.lat),
        lng: Number(record.destLocation.lng),
      },
      driver: record.driver ? { name: record.driver.name } : null,
      vehicle: record.vehicle
        ? { name: record.vehicle.name, regNo: record.vehicle.regNo }
        : null,
      createdAt: new Date(record.createdAt).toISOString(),
      completedAt: record.completedAt ? new Date(record.completedAt).toISOString() : null,
      cancelledAt: record.cancelledAt ? new Date(record.cancelledAt).toISOString() : null,
      cancelReason: record.cancelReason ?? null,
    };
  }

  private deriveHistoryStatus(record: PassengerRideHistoryRecord): 'COMPLETED' | 'CANCELLED' {
    return record.cancelledAt ? 'CANCELLED' : 'COMPLETED';
  }

  private resolveHistoryFare(record: PassengerRideHistoryRecord): number {
    return record.farePaisa !== null && record.farePaisa !== undefined
      ? record.farePaisa
      : record.originalEstimateFarePaisa;
  }

  async payWithTeslaPay(rideId: string, passengerId: string): Promise<PayRideResponseDto> {
    return await this.db.transaction(async (tx) => {
      const info = await this.findAndValidateTeslaPayRide(rideId, passengerId, tx);
      return await this.executeTeslaPaySettlement(info, passengerId, tx);
    });
  }

  private async findAndValidateTeslaPayRide(
    rideId: string,
    passengerId: string,
    tx: any
  ): Promise<PassengerRideTeslaPaySettlementInfo> {
    const info = await this.ridesRepo.findRideForTeslaPaySettlement(rideId, tx);
    this.assertRideEligibility(info, passengerId);
    this.assertPaymentPending(info!);
    return info!;
  }

  private assertRideEligibility(
    info: PassengerRideTeslaPaySettlementInfo | null,
    passengerId: string
  ): void {
    if (!info) {
      throw new NotFoundError('RIDE_NOT_FOUND', 'Ride not found');
    }
    this.assertRideOwnership(info, passengerId);
    this.assertRideCompleted(info);
    this.assertPaymentMethodIsTeslaPay(info);
  }

  private assertRideOwnership(info: PassengerRideTeslaPaySettlementInfo, passengerId: string): void {
    if (info.passengerId !== passengerId) {
      throw new ForbiddenError('Access forbidden: ride does not belong to passenger');
    }
  }

  private assertRideCompleted(info: PassengerRideTeslaPaySettlementInfo): void {
    if (!info.completedAt) {
      throw new InvalidTransitionError('RIDE_NOT_COMPLETED', 'Ride is not completed yet');
    }
  }

  private assertPaymentMethodIsTeslaPay(info: PassengerRideTeslaPaySettlementInfo): void {
    if (info.paymentMethod !== 'TESLAPAY') {
      throw new InvalidTransitionError(
        'INVALID_PAYMENT_METHOD',
        'Only TeslaPay payments can be digitally settled'
      );
    }
  }

  private assertPaymentPending(info: PassengerRideTeslaPaySettlementInfo): void {
    if (!info.paymentId) {
      throw new NotFoundError('PAYMENT_NOT_FOUND', 'Payment record not found for this ride');
    }
    if (info.paymentStatus === 'PAID') {
      throw new ConflictError('PAYMENT_ALREADY_PAID', 'Payment is already paid');
    }
    if (info.paymentStatus !== 'PENDING') {
      throw new InvalidTransitionError('INVALID_PAYMENT_STATUS', 'Payment is not in pending status');
    }
  }

  private async executeTeslaPaySettlement(
    info: PassengerRideTeslaPaySettlementInfo,
    passengerId: string,
    tx: any
  ): Promise<PayRideResponseDto> {
    const paidAt = new Date();
    const updated = await this.ridesRepo.markTeslaPayPaymentAsPaid(info.paymentId!, passengerId, paidAt, tx);
    if (!updated) {
      throw new ConflictError('PAYMENT_ALREADY_PAID', 'Payment is already paid');
    }
    await this.recordTeslaPayAuditEvent(info, updated, passengerId, tx);
    return this.formatPayRideResponse(updated);
  }

  private async recordTeslaPayAuditEvent(
    info: PassengerRideTeslaPaySettlementInfo,
    payment: Payment,
    passengerId: string,
    tx: any
  ): Promise<void> {
    await this.eventsService.logRideEvent(
      {
        event: 'PAYMENT_COMPLETED',
        actorType: 'PASSENGER',
        actorId: passengerId,
        poolId: info.poolId,
        passengerRideId: info.passengerRideId,
        rideRequestId: info.rideRequestId,
        fromState: 'PENDING',
        toState: 'PAID',
        payload: {
          paymentId: payment.id,
          method: payment.method,
          amountPaisa: payment.amountPaisa,
          markedBy: passengerId,
          paidAt: payment.paidAt,
        },
      },
      tx
    );
  }

  private formatPayRideResponse(payment: Payment): PayRideResponseDto {
    return {
      success: true,
      payment: {
        id: payment.id,
        passengerRideId: payment.passengerRideId,
        method: payment.method,
        amountPaisa: payment.amountPaisa,
        status: payment.status,
        paidAt: payment.paidAt,
        markedBy: payment.markedBy,
      },
    };
  }
}

export default RidesService;
