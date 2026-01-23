import { redisClient } from '../config/database';
import Booking from '../models/Booking';
import User from '../models/User';
import notificationService from './notificationService';
import eventBus, { AppEventType } from './eventBus';

// Types
interface MatchingCriteria {
  pickupLat: number;
  pickupLng: number;
  vehicleType: string;
  radius: number; // in kilometers
}

interface MatchedDriver {
  driverId: string;
  distance: number; // in meters
  name: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  rating: number;
}

// Redis key prefixes
const DRIVER_LOCATION_KEY = 'driver:locations';
const DRIVER_AVAILABLE_KEY = 'driver:available';
const DRIVER_METADATA_PREFIX = 'driver:metadata:';

/**
 * Update driver's location in Redis GEO index
 */
export const updateDriverLocation = async (
  driverId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    if (!redisClient) return;

    await redisClient.geoAdd(DRIVER_LOCATION_KEY, {
      longitude,
      latitude,
      member: driverId,
    });

    const driver = await User.findById(driverId).select('driverProfile name');
    if (driver?.driverProfile) {
      const metadata = {
        vehicleType: driver.driverProfile.vehicleType,
        vehicleNumber: driver.driverProfile.vehicleNumber,
        isAvailable: driver.driverProfile.isAvailable,
        lastUpdated: new Date().toISOString(),
      };

      await redisClient.setEx(
        `${DRIVER_METADATA_PREFIX}${driverId}`,
        3600,
        JSON.stringify(metadata)
      );
    }
  } catch (error: any) {
    console.error('[MatchingService] Error updating location:', error.message);
  }
};

/**
 * Mark driver as available/unavailable
 */
export const setDriverAvailability = async (
  driverId: string,
  isAvailable: boolean
): Promise<void> => {
  try {
    if (!redisClient) return;

    if (isAvailable) {
      await redisClient.sAdd(DRIVER_AVAILABLE_KEY, driverId);
    } else {
      await redisClient.sRem(DRIVER_AVAILABLE_KEY, driverId);
    }

    const metadataKey = `${DRIVER_METADATA_PREFIX}${driverId}`;
    const metadataStr = await redisClient.get(metadataKey);

    if (metadataStr) {
      const metadata = JSON.parse(metadataStr);
      metadata.isAvailable = isAvailable;
      metadata.lastUpdated = new Date().toISOString();
      await redisClient.setEx(metadataKey, 3600, JSON.stringify(metadata));
    }

    await User.findByIdAndUpdate(driverId, {
      'driverProfile.isAvailable': isAvailable
    });
  } catch (error: any) {
    console.error('[MatchingService] Error setting availability:', error.message);
  }
};

/**
 * Find nearby available drivers
 */
export const findNearbyDrivers = async (
  criteria: MatchingCriteria
): Promise<MatchedDriver[]> => {
  try {
    if (!redisClient) return [];

    const { pickupLat, pickupLng, vehicleType, radius } = criteria;

    const nearbyResults = await redisClient.geoSearch(
      DRIVER_LOCATION_KEY,
      { longitude: pickupLng, latitude: pickupLat },
      { radius, unit: 'km' },
      { WITHDIST: true, COUNT: 50 }
    );

    if (!nearbyResults?.length) return [];

    const availableDriverIds = await redisClient.sMembers(DRIVER_AVAILABLE_KEY);
    const availableSet = new Set(availableDriverIds);
    const matchedDrivers: MatchedDriver[] = [];

    for (const result of nearbyResults) {
      const driverId = result.member as string;
      if (!availableSet.has(driverId)) continue;

      const metadataStr = await redisClient.get(`${DRIVER_METADATA_PREFIX}${driverId}`);
      if (!metadataStr) continue;
      const metadata = JSON.parse(metadataStr);

      if (vehicleType !== 'any' && metadata.vehicleType !== vehicleType) continue;

      // In production, you might want to cache basic profile info in Redis 
      // to avoid frequent DB hits during matching
      const driver = await User.findById(driverId).select('name phone driverProfile');
      if (!driver?.driverProfile) continue;

      matchedDrivers.push({
        driverId,
        distance: parseFloat(result.distance as string) * 1000,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.driverProfile.vehicleType || metadata.vehicleType,
        vehicleNumber: driver.driverProfile.vehicleNumber || metadata.vehicleNumber,
        rating: driver.driverProfile.rating?.average || 4.5,
      });
    }

    return matchedDrivers.sort((a, b) => a.distance - b.distance);
  } catch (error: any) {
    console.error('[MatchingService] Error finding drivers:', error.message);
    return [];
  }
};

/**
 * Auto-match booking with surge pricing and notifications
 */
export const autoMatchBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking || (booking.status !== 'pending' && booking.status !== 'searching')) return false;

    // 1. Calculate Surge Pricing (Simplistic version)
    // High demand = many pending bookings in the same area
    const nearbyPendingCount = await Booking.countDocuments({
      status: 'searching',
      'pickup.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [booking.pickup.coordinates.lng, booking.pickup.coordinates.lat]
          },
          $maxDistance: 5000 // 5km
        }
      }
    });

    if (nearbyPendingCount > 10) {
      booking.fare.surge = booking.fare.base * 0.2; // 20% surge
      booking.calculateFare();
      await booking.save();
    }

    // 2. Find Drivers
    const matchedDrivers = await findNearbyDrivers({
      pickupLat: booking.pickup.coordinates.lat,
      pickupLng: booking.pickup.coordinates.lng,
      vehicleType: booking.vehicleType,
      radius: 10
    });

    if (!matchedDrivers.length) {
      booking.status = 'no_drivers_available';
      await booking.save();
      // Notify customer
      notificationService.sendNotification({
        userId: booking.customer.toString(),
        type: (notificationService as any).NotificationType.BOOKING_CANCELLED,
        customTitle: 'No Drivers Found',
        customBody: 'We couldn\'t find any drivers nearby. Please try again.'
      });
      return false;
    }

    // 3. Notify Top 5 Drivers
    const topDrivers = matchedDrivers.slice(0, 5);
    for (const d of topDrivers) {
      notificationService.notifyNewBookingRequest(
        d.driverId,
        booking.pickup.address,
        booking.drop.address,
        booking.fare.total * 0.8,
        bookingId
      );
    }

    booking.status = 'searching';
    booking.notifiedDrivers = topDrivers.map(d => d.driverId);
    await booking.save();

    return true;
  } catch (error: any) {
    console.error('[MatchingService] Auto-match failed:', error.message);
    return false;
  }
};

/**
 * Assign driver (Acceptance logic)
 */
export const assignDriverToBooking = async (bookingId: string, driverId: string): Promise<boolean> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking || (booking.status !== 'searching' && booking.status !== 'pending')) return false;

    const driver = await User.findById(driverId);
    if (!driver) return false;

    booking.driver = driverId as any;
    booking.status = 'confirmed';
    booking.driverAssignment = {
      ...booking.driverAssignment,
      acceptedAt: new Date()
    };
    await booking.save();

    await setDriverAvailability(driverId, false);

    // Publish event for wallet/history/notifications
    eventBus.publish(AppEventType.BOOKING_ACCEPTED, { bookingId, driverId });

    // Notify other drivers
    if (booking.notifiedDrivers) {
      for (const nid of booking.notifiedDrivers) {
        if (nid !== driverId) {
          notificationService.sendInAppNotification({
            userId: nid,
            type: (notificationService as any).NotificationType.BOOKING_CANCELLED_BY_CUSTOMER,
            customBody: 'Booking already taken by another driver'
          });
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error('[MatchingService] Assignment failed:', error.message);
    return false;
  }
};

export const releaseDriver = async (driverId: string) => setDriverAvailability(driverId, true);
