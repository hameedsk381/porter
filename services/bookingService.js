const axios = require('axios');

// Calculate distance between two coordinates using Google Maps API
const calculateDistance = async (origin, destination) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        units: 'metric'
      }
    });

    const element = response.data.rows[0].elements[0];
    
    if (element.status === 'OK') {
      return {
        distance: element.distance.value / 1000, // Convert to km
        duration: element.duration.value / 60, // Convert to minutes
        distanceText: element.distance.text,
        durationText: element.duration.text
      };
    }

    throw new Error('Unable to calculate distance');
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw new Error('Failed to calculate distance');
  }
};

// Calculate fare based on distance, time, and vehicle type
const calculateFare = async (pickup, drop, vehicleType, requirements = {}) => {
  try {
    // Calculate distance and duration
    const { distance, duration } = await calculateDistance(pickup.coordinates, drop.coordinates);

    // Base fare structure (in INR)
    const fareStructure = {
      '2-wheeler': {
        base: 30,
        perKm: 8,
        perMinute: 1,
        minimum: 50
      },
      'mini-truck': {
        base: 50,
        perKm: 12,
        perMinute: 2,
        minimum: 100
      },
      'tempo': {
        base: 60,
        perKm: 15,
        perMinute: 2.5,
        minimum: 120
      },
      '3-wheeler': {
        base: 40,
        perKm: 10,
        perMinute: 1.5,
        minimum: 80
      },
      'large-truck': {
        base: 80,
        perKm: 20,
        perMinute: 3,
        minimum: 200
      }
    };

    const rates = fareStructure[vehicleType];
    if (!rates) {
      throw new Error('Invalid vehicle type');
    }

    // Calculate base fare
    const baseFare = rates.base;
    
    // Calculate distance fare
    const distanceFare = Math.ceil(distance * rates.perKm);
    
    // Calculate time fare
    const timeFare = Math.ceil(duration * rates.perMinute);
    
    // Calculate surge pricing (simplified - in real app, this would be dynamic)
    const surgeMultiplier = 1.0; // No surge by default
    const surgeFare = 0;

    // Calculate total fare
    let totalFare = baseFare + distanceFare + timeFare + surgeFare;
    
    // Apply minimum fare
    totalFare = Math.max(totalFare, rates.minimum);

    // Add additional charges for special requirements
    let additionalCharges = 0;
    if (requirements.helper) {
      additionalCharges += 50;
    }
    if (requirements.fragile) {
      additionalCharges += 30;
    }
    if (requirements.heavy) {
      additionalCharges += 100;
    }

    totalFare += additionalCharges;

    return {
      distance: {
        value: Math.round(distance * 100) / 100,
        unit: 'km'
      },
      duration: {
        value: Math.round(duration),
        unit: 'minutes'
      },
      fare: {
        base: baseFare,
        distance: distanceFare,
        time: timeFare,
        surge: surgeFare,
        additional: additionalCharges,
        total: totalFare,
        currency: 'INR'
      },
      breakdown: {
        baseFare,
        distanceFare,
        timeFare,
        surgeFare,
        additionalCharges,
        totalFare
      }
    };
  } catch (error) {
    console.error('Fare calculation error:', error);
    throw new Error('Failed to calculate fare');
  }
};

// Find nearby drivers
const findNearbyDrivers = async (pickupCoordinates, vehicleType, maxDistance = 10) => {
  try {
    const User = require('../models/User');
    
    const drivers = await User.find({
      role: 'driver',
      'driverProfile.isAvailable': true,
      'driverProfile.isKYCVerified': true,
      'driverProfile.vehicleDetails.type': vehicleType,
      'driverProfile.currentLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickupCoordinates.lng, pickupCoordinates.lat]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    })
    .select('name phone profileImage driverProfile.vehicleDetails driverProfile.rating driverProfile.currentLocation')
    .limit(10);

    return drivers;
  } catch (error) {
    console.error('Find nearby drivers error:', error);
    throw new Error('Failed to find nearby drivers');
  }
};

// Get real-time traffic data (placeholder - would integrate with traffic API)
const getTrafficData = async (origin, destination) => {
  try {
    // In a real implementation, you would integrate with traffic APIs
    // like Google Maps Traffic API, HERE Traffic API, etc.
    
    // For now, return mock data
    return {
      trafficLevel: 'moderate',
      delay: 5, // minutes
      route: 'optimal'
    };
  } catch (error) {
    console.error('Traffic data error:', error);
    return {
      trafficLevel: 'unknown',
      delay: 0,
      route: 'default'
    };
  }
};

// Calculate estimated arrival time
const calculateETA = async (driverLocation, pickupLocation, trafficData = null) => {
  try {
    const { distance, duration } = await calculateDistance(driverLocation, pickupLocation);
    
    // Adjust for traffic if data is available
    let adjustedDuration = duration;
    if (trafficData && trafficData.delay) {
      adjustedDuration += trafficData.delay;
    }

    return {
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(adjustedDuration),
      eta: new Date(Date.now() + adjustedDuration * 60 * 1000)
    };
  } catch (error) {
    console.error('ETA calculation error:', error);
    throw new Error('Failed to calculate ETA');
  }
};

// Validate booking data
const validateBookingData = (bookingData) => {
  const errors = [];

  if (!bookingData.pickup || !bookingData.pickup.coordinates) {
    errors.push('Pickup location is required');
  }

  if (!bookingData.drop || !bookingData.drop.coordinates) {
    errors.push('Drop location is required');
  }

  if (!bookingData.vehicleType) {
    errors.push('Vehicle type is required');
  }

  const validVehicleTypes = ['2-wheeler', 'mini-truck', 'tempo', '3-wheeler', 'large-truck'];
  if (bookingData.vehicleType && !validVehicleTypes.includes(bookingData.vehicleType)) {
    errors.push('Invalid vehicle type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  calculateDistance,
  calculateFare,
  findNearbyDrivers,
  getTrafficData,
  calculateETA,
  validateBookingData
};
