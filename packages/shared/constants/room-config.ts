import { RoomType, PropertyZone } from '../types/room';

export interface RoomTypeConfig {
  checkoutCleanMinutes: number;
  checkoutBufferMinutes: number;
  stayoverCleanMinutes: number;
  stayoverBufferMinutes: number;
  turndownMinutes: number;
  turndownBufferMinutes: number;
}

export const ROOM_TYPE_CONFIG: Record<RoomType, RoomTypeConfig> = {
  [RoomType.ClassicGuestroom]: {
    checkoutCleanMinutes: 35,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 20,
    stayoverBufferMinutes: 5,
    turndownMinutes: 10,
    turndownBufferMinutes: 5,
  },
  [RoomType.DeluxeGuestroom]: {
    checkoutCleanMinutes: 40,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 25,
    stayoverBufferMinutes: 5,
    turndownMinutes: 12,
    turndownBufferMinutes: 5,
  },
  [RoomType.PoolsideGuestroom]: {
    checkoutCleanMinutes: 40,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 25,
    stayoverBufferMinutes: 5,
    turndownMinutes: 12,
    turndownBufferMinutes: 5,
  },
  [RoomType.BalconyDeluxe]: {
    checkoutCleanMinutes: 45,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 25,
    stayoverBufferMinutes: 5,
    turndownMinutes: 12,
    turndownBufferMinutes: 5,
  },
  [RoomType.BahamaSuite]: {
    checkoutCleanMinutes: 55,
    checkoutBufferMinutes: 15,
    stayoverCleanMinutes: 30,
    stayoverBufferMinutes: 10,
    turndownMinutes: 15,
    turndownBufferMinutes: 5,
  },
  [RoomType.DoubleDeluxe]: {
    checkoutCleanMinutes: 45,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 25,
    stayoverBufferMinutes: 5,
    turndownMinutes: 12,
    turndownBufferMinutes: 5,
  },
  [RoomType.PremiereDouble]: {
    checkoutCleanMinutes: 50,
    checkoutBufferMinutes: 10,
    stayoverCleanMinutes: 28,
    stayoverBufferMinutes: 5,
    turndownMinutes: 14,
    turndownBufferMinutes: 5,
  },
  [RoomType.JamesHaskinsSuite]: {
    checkoutCleanMinutes: 60,
    checkoutBufferMinutes: 15,
    stayoverCleanMinutes: 35,
    stayoverBufferMinutes: 10,
    turndownMinutes: 18,
    turndownBufferMinutes: 5,
  },
  [RoomType.JuliusOttoSuite]: {
    checkoutCleanMinutes: 60,
    checkoutBufferMinutes: 15,
    stayoverCleanMinutes: 35,
    stayoverBufferMinutes: 10,
    turndownMinutes: 18,
    turndownBufferMinutes: 5,
  },
  [RoomType.WilliamKerrSuite]: {
    checkoutCleanMinutes: 60,
    checkoutBufferMinutes: 15,
    stayoverCleanMinutes: 35,
    stayoverBufferMinutes: 10,
    turndownMinutes: 18,
    turndownBufferMinutes: 5,
  },
};

export interface PropertyZoneConfig {
  name: PropertyZone;
  address: string;
  rooms: number[];
  commonAreas: string[];
  travelTimeMinutes: Record<PropertyZone, number>;
}

// Canonical 44-room split per functional spec §8 / Function 38.
// Fleming: rooms 1–27 (27 rooms). Simonton: 30–34, 40–42, 50, 60–63, 70–73 (17 rooms).
export const TOTAL_ROOMS = 44;

export const PROPERTY_ZONES: PropertyZoneConfig[] = [
  {
    name: PropertyZone.Fleming,
    address: '600 Fleming Street',
    rooms: [
      1, 2, 3, 4, 5, 6, 7, 8, 9,
      10, 11, 12, 13, 14, 15, 16, 17, 18,
      19, 20, 21, 22, 23, 24, 25, 26, 27,
    ],
    commonAreas: [
      'Fleming Lobby',
      'Fleming Pool',
      'Pool Bathrooms',
      'Cafe',
      'Restaurant Guest Bathroom (North)',
      'Restaurant Guest Bathroom (South)',
      'Restaurant Staff Bathroom',
    ],
    travelTimeMinutes: {
      [PropertyZone.Fleming]: 0,
      [PropertyZone.Simonton]: 5,
    },
  },
  {
    name: PropertyZone.Simonton,
    address: '414 Simonton Street',
    rooms: [30, 31, 32, 33, 34, 40, 41, 42, 50, 60, 61, 62, 63, 70, 71, 72, 73],
    commonAreas: ['Simonton Courtyard', 'Simonton Laundry'],
    travelTimeMinutes: {
      [PropertyZone.Fleming]: 5,
      [PropertyZone.Simonton]: 0,
    },
  },
];

// Equipment that lives inside the restaurant is out of scope for
// table/POS/kitchen flows but in scope for maintenance PMs and the
// housekeeping cleaning of its bathrooms. These slugs are the canonical
// maintenance targets for that equipment.
export const RESTAURANT_EQUIPMENT_LOCATIONS = [
  'restaurant-hvac',
  'restaurant-grease-trap',
  'restaurant-walk-in-cooler',
  'restaurant-walk-in-freezer',
  'restaurant-ice-machine',
  'restaurant-exhaust-hood',
] as const;
