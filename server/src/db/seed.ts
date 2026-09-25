import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, queryClient } from './client.js';
import {
  locations,
  routes,
  routeStops,
  routeSegments,
  users,
  vehicles,
} from './schema/index.js';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const N = 16384;
  const r = 8;
  const p = 1;
  const keyLen = 64;
  const derivedKey = crypto.scryptSync(password, salt, keyLen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt}$${derivedKey.toString('hex')}`;
}

const DEMO_PASSWORD = 'Password123!';

const LOCATIONS_DATA = [
  { name: 'Uttara', lat: '23.875900', lng: '90.379500' },
  { name: 'Banani', lat: '23.793700', lng: '90.406600' },
  { name: 'Gulshan', lat: '23.792500', lng: '90.415200' },
  { name: 'Mohakhali', lat: '23.777600', lng: '90.405400' },
  { name: 'Bashundhara', lat: '23.819100', lng: '90.432600' },
  { name: 'Mirpur', lat: '23.807100', lng: '90.368600' },
  { name: 'Farmgate', lat: '23.757000', lng: '90.388800' },
  { name: 'Dhanmondi', lat: '23.746100', lng: '90.374200' },
];

const ROUTES_DATA = [
  {
    code: 'banani-south',
    name: 'Banani to Mohakhali via Gulshan',
    stops: ['Banani', 'Gulshan', 'Mohakhali'],
    segments: [
      { from: 'Banani', to: 'Gulshan', distanceM: 2000 },
      { from: 'Gulshan', to: 'Mohakhali', distanceM: 3000 },
    ],
  },
  {
    code: 'banani-east',
    name: 'Banani to Bashundhara via Gulshan',
    stops: ['Banani', 'Gulshan', 'Bashundhara'],
    segments: [
      { from: 'Banani', to: 'Gulshan', distanceM: 2000 },
      { from: 'Gulshan', to: 'Bashundhara', distanceM: 3100 },
    ],
  },
  {
    code: 'uttara-spine',
    name: 'Uttara to Gulshan via Banani',
    stops: ['Uttara', 'Banani', 'Gulshan'],
    segments: [
      { from: 'Uttara', to: 'Banani', distanceM: 7000 },
      { from: 'Banani', to: 'Gulshan', distanceM: 2000 },
    ],
  },
  {
    code: 'mirpur-central',
    name: 'Mirpur to Dhanmondi via Farmgate',
    stops: ['Mirpur', 'Farmgate', 'Dhanmondi'],
    segments: [
      { from: 'Mirpur', to: 'Farmgate', distanceM: 5000 },
      { from: 'Farmgate', to: 'Dhanmondi', distanceM: 3000 },
    ],
  },
  {
    code: 'mohakhali-north',
    name: 'Mohakhali to Banani via Gulshan',
    stops: ['Mohakhali', 'Gulshan', 'Banani'],
    segments: [
      { from: 'Mohakhali', to: 'Gulshan', distanceM: 3000 },
      { from: 'Gulshan', to: 'Banani', distanceM: 2000 },
    ],
  },
];

const USERS_DATA = [
  {
    name: 'Jashim Uddin',
    email: 'jashim@example.com',
    role: 'DRIVER' as const,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Nusrat Jahan',
    email: 'nusrat@example.com',
    role: 'PASSENGER' as const,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Rafiqul Islam',
    email: 'rafiq@example.com',
    role: 'PASSENGER' as const,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Shirin Akter',
    email: 'shirin@example.com',
    role: 'PASSENGER' as const,
    password: DEMO_PASSWORD,
  },
  {
    name: 'Tanjim Ahmed',
    email: 'tanjim@example.com',
    role: 'PASSENGER' as const,
    password: DEMO_PASSWORD,
  },
];

export async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // 1. Assert Seed Integrity (route-invariance of segment distances)
  const pairDistanceMap = new Map<string, { distanceM: number; routeCode: string }>();
  for (const r of ROUTES_DATA) {
    for (const seg of r.segments) {
      const key = `${seg.from}->${seg.to}`;
      const existing = pairDistanceMap.get(key);
      if (existing && existing.distanceM !== seg.distanceM) {
        throw new Error(
          `Seed integrity violation: Pair ${key} has distance ${seg.distanceM}m on ${r.code}, but ${existing.distanceM}m on ${existing.routeCode}!`
        );
      }
      pairDistanceMap.set(key, { distanceM: seg.distanceM, routeCode: r.code });
    }
  }
  console.log('✓ Seed integrity check passed: all shared segments have consistent distances.');

  // 2. Seed Locations
  for (const loc of LOCATIONS_DATA) {
    await db
      .insert(locations)
      .values(loc)
      .onConflictDoNothing({ target: locations.name });
  }
  const allLocations = await db.select().from(locations);
  const locationMap = new Map(allLocations.map((l) => [l.name, l.id]));
  console.log(`✓ Seeded ${allLocations.length} locations.`);

  // 3. Seed Routes
  for (const r of ROUTES_DATA) {
    await db
      .insert(routes)
      .values({ code: r.code, name: r.name })
      .onConflictDoNothing({ target: routes.code });
  }
  const allRoutes = await db.select().from(routes);
  const routeMap = new Map(allRoutes.map((r) => [r.code, r.id]));
  console.log(`✓ Seeded ${allRoutes.length} routes.`);

  // 4. Seed Route Stops & Segments
  for (const r of ROUTES_DATA) {
    const routeId = routeMap.get(r.code);
    if (!routeId) continue;

    for (let pos = 0; pos < r.stops.length; pos++) {
      const locName = r.stops[pos];
      const locationId = locationMap.get(locName);
      if (!locationId) throw new Error(`Unknown location: ${locName}`);

      await db
        .insert(routeStops)
        .values({
          routeId,
          locationId,
          position: pos + 1,
        })
        .onConflictDoNothing();
    }

    for (const seg of r.segments) {
      const fromLocationId = locationMap.get(seg.from);
      const toLocationId = locationMap.get(seg.to);
      if (!fromLocationId || !toLocationId) {
        throw new Error(`Unknown location in segment: ${seg.from} -> ${seg.to}`);
      }

      await db
        .insert(routeSegments)
        .values({
          routeId,
          fromLocationId,
          toLocationId,
          distanceM: seg.distanceM,
        })
        .onConflictDoNothing();
    }
  }
  console.log('✓ Seeded route stops and segments.');

  // 5. Seed Demo Users
  for (const u of USERS_DATA) {
    await db
      .insert(users)
      .values({
        name: u.name,
        email: u.email.toLowerCase(),
        passwordHash: hashPassword(u.password),
        role: u.role,
      })
      .onConflictDoNothing({ target: users.email });
  }
  console.log(`✓ Seeded ${USERS_DATA.length} demo users (all passwords: "${DEMO_PASSWORD}").`);

  // 6. Seed Demo Vehicle for Driver Jashim
  const [jashim] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'jashim@example.com'));

  if (jashim) {
    await db
      .insert(vehicles)
      .values({
        driverId: jashim.id,
        name: 'Bullet',
        regNo: 'DHK-TESLA-001',
        capacity: 3,
        status: 'ONLINE',
      })
      .onConflictDoNothing({ target: vehicles.driverId });
    console.log('✓ Seeded vehicle "Bullet" (capacity: 3, ONLINE) for driver Jashim.');
  }

  console.log('🎉 Database seed completed successfully.');
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .catch((err) => {
      console.error('❌ Database seed failed:', err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await queryClient.end();
    });
}
