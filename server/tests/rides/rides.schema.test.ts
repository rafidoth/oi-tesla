import { describe, it, expect } from 'vitest';
import { requestRideSchema, createRideSchema, cancelRideSchema } from '../../src/modules/rides/rides.schema.js';

describe('requestRideSchema validation tests', () => {
  it('successfully validates correct input', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
      seats: 2,
    };
    const parsed = requestRideSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 2,
      });
    }
  });

  it('defaults seats to 1 when omitted', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
    };
    const parsed = requestRideSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.seats).toBe(1);
    }
  });

  it('coerces string numbers to integers', () => {
    const input = {
      pickupLocationId: '2',
      destLocationId: '4',
      seats: '3',
    };
    const parsed = requestRideSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 3,
      });
    }
  });

  it('rejects identical pickup and destination locations', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 2,
      seats: 1,
    };
    const parsed = requestRideSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      expect(issue.message).toBe('Pickup and destination locations cannot be the same');
      expect(issue.path).toEqual(['destLocationId']);
    }
  });

  it('rejects seats less than 1 or greater than 4', () => {
    expect(requestRideSchema.safeParse({ pickupLocationId: 1, destLocationId: 2, seats: 0 }).success).toBe(false);
    expect(requestRideSchema.safeParse({ pickupLocationId: 1, destLocationId: 2, seats: 5 }).success).toBe(false);
  });

  it('rejects non-positive location IDs', () => {
    expect(requestRideSchema.safeParse({ pickupLocationId: 0, destLocationId: 2 }).success).toBe(false);
    expect(requestRideSchema.safeParse({ pickupLocationId: 1, destLocationId: -1 }).success).toBe(false);
  });
});

describe('createRideSchema validation tests', () => {
  it('successfully validates and applies defaults for seats (1) and paymentMethod (CASH)', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
    };
    const parsed = createRideSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 1,
        paymentMethod: 'CASH',
      });
    }
  });

  it('accepts explicit seats and TESLAPAY paymentMethod', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
      seats: 3,
      paymentMethod: 'TESLAPAY',
    };
    const parsed = createRideSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        pickupLocationId: 2,
        destLocationId: 4,
        seats: 3,
        paymentMethod: 'TESLAPAY',
      });
    }
  });

  it('rejects invalid paymentMethod', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 4,
      paymentMethod: 'CREDIT_CARD',
    };
    const parsed = createRideSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it('rejects identical pickup and destination locations', () => {
    const input = {
      pickupLocationId: 2,
      destLocationId: 2,
    };
    const parsed = createRideSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe('Pickup and destination locations cannot be the same');
    }
  });

  it('rejects seats out of range', () => {
    expect(createRideSchema.safeParse({ pickupLocationId: 1, destLocationId: 2, seats: 0 }).success).toBe(false);
    expect(createRideSchema.safeParse({ pickupLocationId: 1, destLocationId: 2, seats: 5 }).success).toBe(false);
  });
});

describe('cancelRideSchema validation tests', () => {
  it('successfully validates empty object or undefined reason', () => {
    const parsed = cancelRideSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({});
    }
  });

  it('validates and trims valid cancellation reason', () => {
    const parsed = cancelRideSchema.safeParse({ reason: '  Driver delay  ' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.reason).toBe('Driver delay');
    }
  });

  it('rejects reason exceeding 255 characters', () => {
    const parsed = cancelRideSchema.safeParse({ reason: 'a'.repeat(256) });
    expect(parsed.success).toBe(false);
  });
});

