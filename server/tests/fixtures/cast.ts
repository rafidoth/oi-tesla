/**
 * Test Cast and Seed Constants for OiTesla Integration Scenarios.
 * Strictly adheres to PRD Section 17 & 18 and Architecture Section 4 & 13.
 */

export const CORRIDOR_C1_LOCATIONS = {
  BANANI: { id: 2, name: 'Banani', lat: '23.793700', lng: '90.406600' },
  GULSHAN: { id: 3, name: 'Gulshan', lat: '23.792500', lng: '90.415200' },
  MOHAKHALI: { id: 4, name: 'Mohakhali', lat: '23.777600', lng: '90.405400' },
} as const;

export const CORRIDOR_C1_ROUTE = {
  id: 1,
  code: 'banani-south',
  name: 'Banani to Mohakhali via Gulshan',
  stops: [
    { id: 1, routeId: 1, locationId: 2, position: 1 },
    { id: 2, routeId: 1, locationId: 3, position: 2 },
    { id: 3, routeId: 1, locationId: 4, position: 3 },
  ],
  segments: [
    { id: 1, routeId: 1, fromLocationId: 2, toLocationId: 3, distanceM: 2000 },
    { id: 2, routeId: 1, fromLocationId: 3, toLocationId: 4, distanceM: 3000 },
  ],
  totalDistanceM: 5000,
} as const;

export const CORRIDOR_C1 = {
  locations: CORRIDOR_C1_LOCATIONS,
  route: CORRIDOR_C1_ROUTE,
  stops: CORRIDOR_C1_ROUTE.stops,
  segments: CORRIDOR_C1_ROUTE.segments,
  totalDistanceM: 5000,
} as const;

export const CAST = {
  driver: {
    id: 'd1000000-0000-0000-0000-000000000001',
    name: 'Jashim Uddin',
    email: 'jashim@example.com',
    role: 'DRIVER' as const,
    vehicle: {
      id: 'v1000000-0000-0000-0000-000000000001',
      name: 'Bullet',
      regNo: 'DHK-TESLA-001',
      capacity: 3,
      status: 'ONLINE' as const,
    },
  },
  passengers: {
    nusrat: {
      id: 'p1000000-0000-0000-0000-000000000001',
      name: 'Nusrat Jahan',
      email: 'nusrat@example.com',
      role: 'PASSENGER' as const,
      pickupLocationId: 2, // Banani
      destLocationId: 4,   // Mohakhali
      seats: 1,
    },
    rafiq: {
      id: 'p1000000-0000-0000-0000-000000000002',
      name: 'Rafiqul Islam',
      email: 'rafiq@example.com',
      role: 'PASSENGER' as const,
      pickupLocationId: 2, // Banani
      destLocationId: 3,   // Gulshan
      seats: 1,
    },
    shirin: {
      id: 'p1000000-0000-0000-0000-000000000003',
      name: 'Shirin Akter',
      email: 'shirin@example.com',
      role: 'PASSENGER' as const,
      pickupLocationId: 2, // Banani
      destLocationId: 3,   // Gulshan
      seats: 1,
    },
    tanjim: {
      id: 'p1000000-0000-0000-0000-000000000004',
      name: 'Tanjim Ahmed',
      email: 'tanjim@example.com',
      role: 'PASSENGER' as const,
      pickupLocationId: 2, // Banani
      destLocationId: 4,   // Mohakhali
      seats: 1,
    },
  },
  jashim: {
    id: 'd1000000-0000-0000-0000-000000000001',
    name: 'Jashim Uddin',
    email: 'jashim@example.com',
    role: 'DRIVER' as const,
    vehicle: {
      id: 'v1000000-0000-0000-0000-000000000001',
      name: 'Bullet',
      regNo: 'DHK-TESLA-001',
      capacity: 3,
      status: 'ONLINE' as const,
    },
  },
  nusrat: {
    id: 'p1000000-0000-0000-0000-000000000001',
    name: 'Nusrat Jahan',
    email: 'nusrat@example.com',
    role: 'PASSENGER' as const,
    pickupLocationId: 2,
    destLocationId: 4,
    seats: 1,
  },
  rafiq: {
    id: 'p1000000-0000-0000-0000-000000000002',
    name: 'Rafiqul Islam',
    email: 'rafiq@example.com',
    role: 'PASSENGER' as const,
    pickupLocationId: 2,
    destLocationId: 3,
    seats: 1,
  },
  shirin: {
    id: 'p1000000-0000-0000-0000-000000000003',
    name: 'Shirin Akter',
    email: 'shirin@example.com',
    role: 'PASSENGER' as const,
    pickupLocationId: 2,
    destLocationId: 3,
    seats: 1,
  },
  tanjim: {
    id: 'p1000000-0000-0000-0000-000000000004',
    name: 'Tanjim Ahmed',
    email: 'tanjim@example.com',
    role: 'PASSENGER' as const,
    pickupLocationId: 2,
    destLocationId: 4,
    seats: 1,
  },
  corridorC1: CORRIDOR_C1,
} as const;

export default CAST;
