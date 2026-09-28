import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriverService } from '../../src/modules/driver/driver.service.js';
import type { DriverRepository } from '../../src/modules/driver/driver.repository.js';
import { NotFoundError } from '../../src/shared/errors/NotFoundError.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import { ConflictError } from '../../src/shared/errors/ConflictError.js';
import { ForbiddenError } from '../../src/shared/errors/ForbiddenError.js';
import type { EventsService } from '../../src/modules/events/events.service.js';
import { CAST } from '../fixtures/cast.js';

describe('DriverService Cash Settlement Unit Tests', () => {
  let mockDriverRepo: {
    findDriverById: ReturnType<typeof vi.fn>;
    findPassengerRideForCashSettlement: ReturnType<typeof vi.fn>;
    markPaymentAsPaid: ReturnType<typeof vi.fn>;
    withTransaction: ReturnType<typeof vi.fn>;
  };
  let mockEventsService: {
    logRideEvent: ReturnType<typeof vi.fn>;
  };
  let driverService: DriverService;

  const validRideInfo = {
    passengerRideId: 'ride-uuid-1',
    rideRequestId: 'req-uuid-1',
    passengerId: CAST.passengers.nusrat.id,
    poolId: 'pool-uuid-1',
    completedAt: new Date('2026-09-28T08:00:00Z'),
    driverId: CAST.driver.id,
    poolStatus: 'COMPLETED',
    paymentId: 'pay-uuid-1',
    paymentMethod: 'CASH',
    paymentAmountPaisa: 35000,
    paymentStatus: 'PENDING',
    paymentPaidAt: null,
    paymentMarkedBy: null,
  };

  const paidPaymentRecord = {
    id: 'pay-uuid-1',
    passengerRideId: 'ride-uuid-1',
    method: 'CASH',
    amountPaisa: 35000,
    status: 'PAID',
    paidAt: new Date('2026-09-28T08:05:00Z'),
    markedBy: CAST.driver.id,
    createdAt: new Date('2026-09-28T08:00:00Z'),
    updatedAt: new Date('2026-09-28T08:05:00Z'),
  };

  beforeEach(() => {
    mockDriverRepo = {
      findDriverById: vi.fn().mockResolvedValue({
        id: CAST.driver.id,
        name: CAST.driver.name,
        email: CAST.driver.email,
        role: CAST.driver.role,
      }),
      findPassengerRideForCashSettlement: vi.fn().mockResolvedValue({ ...validRideInfo }),
      markPaymentAsPaid: vi.fn().mockResolvedValue({ ...paidPaymentRecord }),
      withTransaction: vi.fn((callback) => callback({})),
    };
    mockEventsService = {
      logRideEvent: vi.fn().mockResolvedValue({} as any),
    };
    driverService = new DriverService(
      mockDriverRepo as unknown as DriverRepository,
      mockEventsService as unknown as EventsService
    );
  });

  it('successfully marks pending cash payment as paid and records audit event', async () => {
    const result = await driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1');

    expect(result.success).toBe(true);
    expect(result.payment.status).toBe('PAID');
    expect(result.payment.markedBy).toBe(CAST.driver.id);
    expect(mockDriverRepo.markPaymentAsPaid).toHaveBeenCalledWith(
      'pay-uuid-1',
      CAST.driver.id,
      expect.any(Date),
      expect.anything()
    );
    expect(mockEventsService.logRideEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'PAYMENT_COMPLETED',
        actorType: 'DRIVER',
        actorId: CAST.driver.id,
        poolId: 'pool-uuid-1',
        passengerRideId: 'ride-uuid-1',
        rideRequestId: 'req-uuid-1',
        fromState: 'PENDING',
        toState: 'PAID',
        payload: expect.objectContaining({
          paymentId: 'pay-uuid-1',
          method: 'CASH',
          amountPaisa: 35000,
          markedBy: CAST.driver.id,
        }),
      }),
      expect.anything()
    );
  });

  it('throws NotFoundError when driver does not exist', async () => {
    mockDriverRepo.findDriverById.mockResolvedValue(null);

    await expect(
      driverService.markCashReceived('unknown-driver', 'ride-uuid-1')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when passenger ride does not exist', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue(null);

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'non-existent-ride')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError when calling driver is not the assigned driver', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      driverId: 'another-driver-id',
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(ForbiddenError);
  });

  it('throws InvalidTransitionError when passenger ride is not completed', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      completedAt: null,
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws NotFoundError when payment record is missing', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      paymentId: null,
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(NotFoundError);
  });

  it('throws InvalidTransitionError when payment method is not CASH', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      paymentMethod: 'TESLAPAY',
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws ConflictError when payment has already been paid', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      paymentStatus: 'PAID',
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(ConflictError);
  });

  it('throws InvalidTransitionError when payment status is not PENDING', async () => {
    mockDriverRepo.findPassengerRideForCashSettlement.mockResolvedValue({
      ...validRideInfo,
      paymentStatus: 'FAILED',
    });

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(InvalidTransitionError);
  });

  it('throws ConflictError when concurrent update fails', async () => {
    mockDriverRepo.markPaymentAsPaid.mockResolvedValue(null);

    await expect(
      driverService.markCashReceived(CAST.driver.id, 'ride-uuid-1')
    ).rejects.toThrow(ConflictError);
  });
});
