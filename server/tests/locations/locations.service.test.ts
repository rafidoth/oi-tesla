import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsService } from '../../src/modules/locations/locations.service.js';
import type { LocationsRepository, RouteWithStops } from '../../src/modules/locations/locations.repository.js';
import { InvalidTransitionError } from '../../src/shared/errors/InvalidTransitionError.js';
import type { Location, RouteSegment } from '../../src/db/schema/index.js';

describe('LocationsService Unit Tests', () => {
  let mockRepo: Partial<LocationsRepository>;
  let locationsService: LocationsService;

  // Mock data representing realistic seed data
  // Locations: 1: Uttara, 2: Banani, 3: Gulshan, 4: Mohakhali, 5: Bashundhara, 6: Mirpur, 7: Farmgate, 8: Dhanmondi
  const mockLocations: Location[] = [
    { id: 1, name: 'Uttara', lat: '23.875900', lng: '90.379500' },
    { id: 2, name: 'Banani', lat: '23.793700', lng: '90.406600' },
    { id: 3, name: 'Gulshan', lat: '23.792500', lng: '90.415200' },
    { id: 4, name: 'Mohakhali', lat: '23.777600', lng: '90.405400' },
    { id: 5, name: 'Bashundhara', lat: '23.819100', lng: '90.432600' },
    { id: 6, name: 'Mirpur', lat: '23.807100', lng: '90.368600' },
    { id: 7, name: 'Farmgate', lat: '23.757000', lng: '90.388800' },
    { id: 8, name: 'Dhanmondi', lat: '23.746100', lng: '90.374200' },
  ];

  // Routes:
  // Route 1 (C1: banani-south): Banani (2) -> Gulshan (3) -> Mohakhali (4)
  // Route 2 (C2: banani-east): Banani (2) -> Gulshan (3) -> Bashundhara (5)
  // Route 3 (C3: uttara-spine): Uttara (1) -> Banani (2) -> Gulshan (3)
  // Route 4 (C4: mirpur-central): Mirpur (6) -> Farmgate (7) -> Dhanmondi (8)
  // Route 5 (C5: mohakhali-north): Mohakhali (4) -> Gulshan (3) -> Banani (2)
  const mockRoutesWithStops: RouteWithStops[] = [
    {
      id: 1,
      code: 'banani-south',
      name: 'Banani to Mohakhali via Gulshan',
      stops: [
        { routeId: 1, locationId: 2, position: 1 },
        { routeId: 1, locationId: 3, position: 2 },
        { routeId: 1, locationId: 4, position: 3 },
      ],
    },
    {
      id: 2,
      code: 'banani-east',
      name: 'Banani to Bashundhara via Gulshan',
      stops: [
        { routeId: 2, locationId: 2, position: 1 },
        { routeId: 2, locationId: 3, position: 2 },
        { routeId: 2, locationId: 5, position: 3 },
      ],
    },
    {
      id: 3,
      code: 'uttara-spine',
      name: 'Uttara to Gulshan via Banani',
      stops: [
        { routeId: 3, locationId: 1, position: 1 },
        { routeId: 3, locationId: 2, position: 2 },
        { routeId: 3, locationId: 3, position: 3 },
      ],
    },
    {
      id: 4,
      code: 'mirpur-central',
      name: 'Mirpur to Dhanmondi via Farmgate',
      stops: [
        { routeId: 4, locationId: 6, position: 1 },
        { routeId: 4, locationId: 7, position: 2 },
        { routeId: 4, locationId: 8, position: 3 },
      ],
    },
    {
      id: 5,
      code: 'mohakhali-north',
      name: 'Mohakhali to Banani via Gulshan',
      stops: [
        { routeId: 5, locationId: 4, position: 1 },
        { routeId: 5, locationId: 3, position: 2 },
        { routeId: 5, locationId: 2, position: 3 },
      ],
    },
  ];

  const mockSegments: RouteSegment[] = [
    // Route 1 (C1)
    { routeId: 1, fromLocationId: 2, toLocationId: 3, distanceM: 2000 },
    { routeId: 1, fromLocationId: 3, toLocationId: 4, distanceM: 3000 },
    // Route 2 (C2)
    { routeId: 2, fromLocationId: 2, toLocationId: 3, distanceM: 2000 },
    { routeId: 2, fromLocationId: 3, toLocationId: 5, distanceM: 3100 },
    // Route 3 (C3)
    { routeId: 3, fromLocationId: 1, toLocationId: 2, distanceM: 7000 },
    { routeId: 3, fromLocationId: 2, toLocationId: 3, distanceM: 2000 },
    // Route 4 (C4)
    { routeId: 4, fromLocationId: 6, toLocationId: 7, distanceM: 5000 },
    { routeId: 4, fromLocationId: 7, toLocationId: 8, distanceM: 3000 },
    // Route 5 (C5)
    { routeId: 5, fromLocationId: 4, toLocationId: 3, distanceM: 3000 },
    { routeId: 5, fromLocationId: 3, toLocationId: 2, distanceM: 2000 },
  ];

  beforeEach(() => {
    mockRepo = {
      findAllLocations: vi.fn().mockResolvedValue(mockLocations),
      findAllRoutesWithStops: vi.fn().mockResolvedValue(mockRoutesWithStops),
      findAllRouteSegments: vi.fn().mockResolvedValue(mockSegments),
    };
    locationsService = new LocationsService(mockRepo as LocationsRepository);
  });

  describe('getLocationsCatalog', () => {
    it('should return parsed locations, routes, and computed servedPairs', async () => {
      const catalog = await locationsService.getLocationsCatalog();

      // Verify locations
      expect(catalog.locations).toHaveLength(8);
      expect(catalog.locations[0]).toEqual({
        id: 1,
        name: 'Uttara',
        lat: 23.8759,
        lng: 90.3795,
      });

      // Verify routes with stops
      expect(catalog.routes).toHaveLength(5);
      expect(catalog.routes[0].code).toBe('banani-south');
      expect(catalog.routes[0].stops).toEqual([
        { locationId: 2, position: 1 },
        { locationId: 3, position: 2 },
        { locationId: 4, position: 3 },
      ]);

      // Verify servedPairs
      expect(catalog.servedPairs.length).toBeGreaterThan(0);

      // Banani (2) -> Gulshan (3) is served by Route 1, Route 2, and Route 3 with distance 2000m
      const bananiGulshan = catalog.servedPairs.find(
        (p) => p.pickupLocationId === 2 && p.destLocationId === 3
      );
      expect(bananiGulshan).toBeDefined();
      expect(bananiGulshan?.distanceM).toBe(2000);
      expect(bananiGulshan?.routeIds).toEqual(expect.arrayContaining([1, 2, 3]));

      // Banani (2) -> Mohakhali (4) is served by Route 1 with distance 5000m
      const bananiMohakhali = catalog.servedPairs.find(
        (p) => p.pickupLocationId === 2 && p.destLocationId === 4
      );
      expect(bananiMohakhali).toBeDefined();
      expect(bananiMohakhali?.distanceM).toBe(5000);
      expect(bananiMohakhali?.routeIds).toEqual([1]);

      // Uttara (1) -> Gulshan (3) is served by Route 3 with distance 7000 + 2000 = 9000m
      const uttaraGulshan = catalog.servedPairs.find(
        (p) => p.pickupLocationId === 1 && p.destLocationId === 3
      );
      expect(uttaraGulshan).toBeDefined();
      expect(uttaraGulshan?.distanceM).toBe(9000);
      expect(uttaraGulshan?.routeIds).toEqual([3]);

      // Mohakhali (4) -> Banani (2) is served by Route 5 with distance 3000 + 2000 = 5000m
      const mohakhaliBanani = catalog.servedPairs.find(
        (p) => p.pickupLocationId === 4 && p.destLocationId === 2
      );
      expect(mohakhaliBanani).toBeDefined();
      expect(mohakhaliBanani?.distanceM).toBe(5000);
      expect(mohakhaliBanani?.routeIds).toEqual([5]);

      // Incompatible pair: Mohakhali (4) -> Bashundhara (5) has no shared route and must not be in servedPairs
      const mohakhaliBashundhara = catalog.servedPairs.find(
        (p) => p.pickupLocationId === 4 && p.destLocationId === 5
      );
      expect(mohakhaliBashundhara).toBeUndefined();
    });
  });

  describe('validateRoutePair', () => {
    it('should validate downstream route traversal and sum consecutive segment distances on C1 (Banani -> Mohakhali = 5000m)', async () => {
      const result = await locationsService.validateRoutePair(2, 4);

      expect(result.isServed).toBe(true);
      expect(result.distanceM).toBe(5000);
      expect(result.routeId).toBe(1);
    });

    it('should calculate single segment distance (Banani -> Gulshan = 2000m)', async () => {
      const result = await locationsService.validateRoutePair(2, 3);

      expect(result.isServed).toBe(true);
      expect(result.distanceM).toBe(2000);
      expect(result.routeId).toBe(1);
    });

    it('should calculate multi-hop distance on C3 (Uttara -> Gulshan = 9000m)', async () => {
      const result = await locationsService.validateRoutePair(1, 3);

      expect(result.isServed).toBe(true);
      expect(result.distanceM).toBe(9000);
      expect(result.routeId).toBe(3);
    });

    it('should calculate downstream traversal on southbound/northbound reverse routes (Mohakhali -> Banani on C5 = 5000m)', async () => {
      const result = await locationsService.validateRoutePair(4, 2);

      expect(result.isServed).toBe(true);
      expect(result.distanceM).toBe(5000);
      expect(result.routeId).toBe(5);
    });

    it('should reject unserved pair throwing InvalidTransitionError with code ROUTE_NOT_SERVED when no route connects them', async () => {
      // Mohakhali (4) to Bashundhara (5) has no route
      await expect(locationsService.validateRoutePair(4, 5)).rejects.toThrow(InvalidTransitionError);

      try {
        await locationsService.validateRoutePair(4, 5);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const error = err as InvalidTransitionError;
        expect(error.code).toBe('ROUTE_NOT_SERVED');
        expect(error.message).toBe('The requested route is not served');
        expect(error.statusCode).toBe(422);
      }
    });

    it('should reject pair when destination is upstream on a directed route with no reverse route', async () => {
      // Bashundhara (5) to Banani (2): C2 is Banani -> Gulshan -> Bashundhara, no route exists from 5 to 2
      await expect(locationsService.validateRoutePair(5, 2)).rejects.toThrow(InvalidTransitionError);

      try {
        await locationsService.validateRoutePair(5, 2);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const error = err as InvalidTransitionError;
        expect(error.code).toBe('ROUTE_NOT_SERVED');
        expect(error.statusCode).toBe(422);
      }
    });

    it('should reject when pickupLocationId equals destLocationId', async () => {
      await expect(locationsService.validateRoutePair(2, 2)).rejects.toThrow(InvalidTransitionError);

      try {
        await locationsService.validateRoutePair(2, 2);
      } catch (err) {
        expect(err).toBeInstanceOf(InvalidTransitionError);
        const error = err as InvalidTransitionError;
        expect(error.code).toBe('ROUTE_NOT_SERVED');
        expect(error.statusCode).toBe(422);
      }
    });

    it('should reject when either locationId is nonexistent', async () => {
      await expect(locationsService.validateRoutePair(999, 2)).rejects.toThrow(InvalidTransitionError);
      await expect(locationsService.validateRoutePair(2, 999)).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe('getDistance', () => {
    it('should return exact distance in meters for a valid served route pair', async () => {
      const distance = await locationsService.getDistance(2, 4);
      expect(distance).toBe(5000);
    });

    it('should throw InvalidTransitionError with code ROUTE_NOT_SERVED for unserved pair', async () => {
      await expect(locationsService.getDistance(4, 5)).rejects.toThrow(InvalidTransitionError);
    });
  });
});
