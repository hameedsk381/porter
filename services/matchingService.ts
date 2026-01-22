import { redisClient } from '../config/database';
import Booking from '../models/Booking';
import User from '../models/User';
import { io } from '../server';

// Types
interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  vehicleType: string;
  isAvailable: boolean;
  lastUpdated: Date;
}

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
    if (!redisClient) {
      console.error('Redis client not available');
      return;
    }

    // Add to GEO index (longitude, latitude, member)
    await redisClient.geoAdd(DRIVER_LOCATION_KEY, {
      longitude,
      latitude,
      member: driverId,
    });

    // Store metadata (vehicle type, availability, etc.)
    const driver = await User.findById(driverId).select('driverProfile');
    if (driver && driver.driverProfile) {
      const metadata = {
        vehicleType: driver.driverProfile.vehicleType,
        vehicleNumber: driver.driverProfile.vehicleNumber,
        isAvailable: driver.driverProfile.isAvailable,
        lastUpdated: new Date().toISOString(),
      };
      
      await redisClient.setEx(
        `${DRIVER_METADATA_PREFIX}${driverId}`,
        3600, // 1 hour TTL
        JSON.stringify(metadata)
      );
    }

    console.log(`✅ Updated location for driver ${driverId}: [${latitude}, ${longitude}]`);
  } catch (error: any) {
    console.error('Error updating driver location:', error.message);
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
    if (!redisClient) {
      console.error('Redis client not available');
      return;
    }

    if (isAvailable) {
      await redisClient.sAdd(DRIVER_AVAILABLE_KEY, driverId);
    } else {
      await redisClient.sRem(DRIVER_AVAILABLE_KEY, driverId);
    }

    // Update metadata
    const metadataKey = `${DRIVER_METADATA_PREFIX}${driverId}`;
    const metadataStr = await redisClient.get(metadataKey);
    
    if (metadataStr) {
      const metadata = JSON.parse(metadataStr);
      metadata.isAvailable = isAvailable;
      metadata.lastUpdated = new Date().toISOString();
      await redisClient.setEx(metadataKey, 3600, JSON.stringify(metadata));
    }

    // Update in database
    await User.findByIdAndUpdate(driverId, { isAvailable });

    console.log(`✅ Driver ${driverId} availability set to ${isAvailable}`);
  } catch (error: any) {
    console.error('Error setting driver availability:', error.message);
  }
};

/**
 * Find nearby available drivers
 */
export const findNearbyDrivers = async (
  criteria: MatchingCriteria
): Promise<MatchedDriver[]> => {
  try {
    if (!redisClient) {
      console.error('Redis client not available');
      return [];
    }

    const { pickupLat, pickupLng, vehicleType, radius } = criteria;

    // Search for drivers within radius using GEOSEARCH
    const nearbyDrivers = await redisClient.geoSearch(
      DRIVER_LOCATION_KEY,
      { longitude: pickupLng, latitude: pickupLat },
      { radius, unit: 'km' },
      { WITHDIST: true, COUNT: 50 } // Get top 50 with distances
    );

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      console.log('No drivers found nearby');
      return [];
    }

    // Filter available drivers with matching vehicle type
    const availableDriverIds = await redisClient.sMembers(DRIVER_AVAILABLE_KEY);
    const availableSet = new Set(availableDriverIds);

    const matchedDrivers: MatchedDriver[] = [];

    for (const result of nearbyDrivers) {
      const driverId = result.member as string;
      const distance = parseFloat(result.distance as string) * 1000; // Convert km to meters

      // Check if driver is available
      if (!availableSet.has(driverId)) continue;

      // Get driver metadata
      const metadataStr = await redisClient.get(`${DRIVER_METADATA_PREFIX}${driverId}`);
      if (!metadataStr) continue;

      const metadata = JSON.parse(metadataStr);

      // Check vehicle type match
      if (vehicleType !== 'any' && metadata.vehicleType !== vehicleType) continue;

      // Get driver details from database
      const driver = await User.findById(driverId).select('name phone driverProfile');
      if (!driver || !driver.driverProfile) continue;

      matchedDrivers.push({
        driverId: driverId,
        distance,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.driverProfile.vehicleType || metadata.vehicleType,
        vehicleNumber: driver.driverProfile.vehicleNumber || metadata.vehicleNumber,
        rating: driver.driverProfile.rating?.average || 4.5,
      });
    }

    // Sort by distance (closest first)
    matchedDrivers.sort((a, b) => a.distance - b.distance);

    console.log(`✅ Found ${matchedDrivers.length} matching drivers for vehicle type: ${vehicleType}`);
    return matchedDrivers;
  } catch (error: any) {
    console.error('Error finding nearby drivers:', error.message);
    return [];
  }
};

/**
 * Auto-match booking with best available driver
 */
export const autoMatchBooking = async (bookingId: string): Promise<boolean> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return false;
    }

    if (booking.status !== 'pending') {
      console.log('Booking already processed:', booking.status);
      return false;
    }

    // Find nearby drivers
    const criteria: MatchingCriteria = {
      pickupLat: booking.pickup.coordinates.lat,
      pickupLng: booking.pickup.coordinates.lng,
      vehicleType: booking.vehicleType,
      radius: 10, // 10km radius
    };

    const matchedDrivers = await findNearbyDrivers(criteria);

    if (matchedDrivers.length === 0) {
      console.log('No available drivers found for booking:', bookingId);
      
      // Update booking status
      booking.status = 'no_drivers_available';
      await booking.save();

      // Notify customer
      io.to(`user:${booking.userId}`).emit('booking:no_drivers', {
        bookingId: booking._id,
        message: 'No drivers available nearby. Please try again later.',
      });

      return false;
    }

    // Send notification to top 5 drivers
    const topDrivers = matchedDrivers.slice(0, 5);
    
    for (const driver of topDrivers) {
      // Send push notification to driver
      io.to(`driver:${driver.driverId}`).emit('booking:new_request', {
        bookingId: booking._id,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        vehicleType: booking.vehicleType,
        estimatedFare: booking.estimatedFare,
        distance: driver.distance,
        customerName: booking.customerName || 'Customer',
      });
    }

    // Update booking with notified drivers
    booking.status = 'searching';
    booking.notifiedDrivers = topDrivers.map(d => d.driverId);
    await booking.save();

    console.log(`✅ Notified ${topDrivers.length} drivers for booking ${bookingId}`);
    return true;
  } catch (error: any) {
    console.error('Error auto-matching booking:', error.message);
    return false;
  }
};

/**
 * Assign driver to booking (when driver accepts)
 */
export const assignDriverToBooking = async (
  bookingId: string,
  driverId: string
): Promise<boolean> => {
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('Booking not found:', bookingId);
      return false;
    }

    if (booking.status !== 'searching' && booking.status !== 'pending') {
      console.log('Booking already assigned or cancelled:', booking.status);
      return false;
    }

    const driver = await User.findById(driverId);
    if (!driver) {
      console.error('Driver not found:', driverId);
      return false;
    }

    // Assign driver to booking
    booking.driver = driverId as any;
    booking.driverId = driverId as any;
    booking.status = 'confirmed';
    booking.assignedAt = new Date();
    await booking.save();

    // Mark driver as unavailable
    await setDriverAvailability(driverId, false);

    // Notify customer
    io.to(`user:${booking.userId}`).emit('booking:driver_assigned', {
      bookingId: booking._id,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleType: driver.driverProfile?.vehicleType,
        vehicleNumber: driver.driverProfile?.vehicleNumber,
        rating: driver.driverProfile?.rating?.average,
      },
    });

    // Notify other drivers that booking is no longer available
    if (booking.notifiedDrivers) {
      for (const notifiedDriverId of booking.notifiedDrivers) {
        if (notifiedDriverId !== driverId) {
          io.to(`driver:${notifiedDriverId}`).emit('booking:cancelled', {
            bookingId: booking._id,
            reason: 'Another driver accepted',
          });
        }
      }
    }

    console.log(`✅ Assigned driver ${driverId} to booking ${bookingId}`);
    return true;
  } catch (error: any) {
    console.error('Error assigning driver to booking:', error.message);
    return false;
  }
};

/**
 * Release driver when booking is completed/cancelled
 */
export const releaseDriver = async (driverId: string): Promise<void> => {
  try {
    await setDriverAvailability(driverId, true);
    console.log(`✅ Released driver ${driverId}`);
  } catch (error: any) {
    console.error('Error releasing driver:', error.message);
  }
};

/**
 * Clean up stale driver locations (older than 1 hour)
 */
export const cleanupStaleDrivers = async (): Promise<void> => {
  try {
    if (!redisClient) return;

    const availableDriverIds = await redisClient.sMembers(DRIVER_AVAILABLE_KEY);

    for (const driverId of availableDriverIds) {
      const metadataStr = await redisClient.get(`${DRIVER_METADATA_PREFIX}${driverId}`);
      if (!metadataStr) {
        // Remove from available set if no metadata
        await redisClient.sRem(DRIVER_AVAILABLE_KEY, driverId);
        continue;
      }

      const metadata = JSON.parse(metadataStr);
      const lastUpdated = new Date(metadata.lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);

      // Remove if older than 1 hour
      if (hoursSinceUpdate > 1) {
        await redisClient.sRem(DRIVER_AVAILABLE_KEY, driverId);
        console.log(`Removed stale driver ${driverId} (${hoursSinceUpdate.toFixed(1)}h old)`);
      }
    }
  } catch (error: any) {
    console.error('Error cleaning up stale drivers:', error.message);
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupStaleDrivers, 15 * 60 * 1000);
