import { EventEmitter } from 'events';

// Event types
export enum BookingEvent {
  CREATED = 'booking:created',
  DRIVER_MATCHED = 'booking:driver_matched',
  DRIVER_ASSIGNED = 'booking:driver_assigned',
  STARTED = 'booking:started',
  COMPLETED = 'booking:completed',
  CANCELLED = 'booking:cancelled',
  NO_DRIVERS = 'booking:no_drivers',
}

export enum DriverEvent {
  WENT_ONLINE = 'driver:went_online',
  WENT_OFFLINE = 'driver:went_offline',
  LOCATION_UPDATED = 'driver:location_updated',
  ACCEPTED_BOOKING = 'driver:accepted_booking',
  REJECTED_BOOKING = 'driver:rejected_booking',
}

// Event payload types
export interface BookingCreatedPayload {
  bookingId: string;
  customerId: string;
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoff: {
    lat: number;
    lng: number;
    address: string;
  };
  vehicleType: string;
  fare: number;
}

export interface DriverMatchedPayload {
  bookingId: string;
  drivers: Array<{
    driverId: string;
    distance: number;
    name: string;
  }>;
}

export interface DriverAssignedPayload {
  bookingId: string;
  driverId: string;
  driverName: string;
  customerId: string;
}

export interface BookingStartedPayload {
  bookingId: string;
  driverId: string;
  customerId: string;
  startedAt: Date;
}

export interface BookingCompletedPayload {
  bookingId: string;
  driverId: string;
  customerId: string;
  fare: number;
  driverEarning: number;
  completedAt: Date;
}

export interface BookingCancelledPayload {
  bookingId: string;
  cancelledBy: 'customer' | 'driver' | 'system';
  reason: string;
  refundAmount?: number;
}

export interface DriverLocationUpdatedPayload {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

// Event Bus Singleton
class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Increase listener limit
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // Type-safe event emission
  public emitBookingCreated(payload: BookingCreatedPayload): void {
    this.emit(BookingEvent.CREATED, payload);
  }

  public emitDriverMatched(payload: DriverMatchedPayload): void {
    this.emit(BookingEvent.DRIVER_MATCHED, payload);
  }

  public emitDriverAssigned(payload: DriverAssignedPayload): void {
    this.emit(BookingEvent.DRIVER_ASSIGNED, payload);
  }

  public emitBookingStarted(payload: BookingStartedPayload): void {
    this.emit(BookingEvent.STARTED, payload);
  }

  public emitBookingCompleted(payload: BookingCompletedPayload): void {
    this.emit(BookingEvent.COMPLETED, payload);
  }

  public emitBookingCancelled(payload: BookingCancelledPayload): void {
    this.emit(BookingEvent.CANCELLED, payload);
  }

  public emitNoDriversAvailable(bookingId: string): void {
    this.emit(BookingEvent.NO_DRIVERS, { bookingId });
  }

  public emitDriverWentOnline(driverId: string): void {
    this.emit(DriverEvent.WENT_ONLINE, { driverId, timestamp: new Date() });
  }

  public emitDriverWentOffline(driverId: string): void {
    this.emit(DriverEvent.WENT_OFFLINE, { driverId, timestamp: new Date() });
  }

  public emitDriverLocationUpdated(payload: DriverLocationUpdatedPayload): void {
    this.emit(DriverEvent.LOCATION_UPDATED, payload);
  }

  public emitDriverAcceptedBooking(driverId: string, bookingId: string): void {
    this.emit(DriverEvent.ACCEPTED_BOOKING, { driverId, bookingId, timestamp: new Date() });
  }

  public emitDriverRejectedBooking(driverId: string, bookingId: string): void {
    this.emit(DriverEvent.REJECTED_BOOKING, { driverId, bookingId, timestamp: new Date() });
  }

  // Type-safe event listeners
  public onBookingCreated(handler: (payload: BookingCreatedPayload) => void): void {
    this.on(BookingEvent.CREATED, handler);
  }

  public onDriverMatched(handler: (payload: DriverMatchedPayload) => void): void {
    this.on(BookingEvent.DRIVER_MATCHED, handler);
  }

  public onDriverAssigned(handler: (payload: DriverAssignedPayload) => void): void {
    this.on(BookingEvent.DRIVER_ASSIGNED, handler);
  }

  public onBookingStarted(handler: (payload: BookingStartedPayload) => void): void {
    this.on(BookingEvent.STARTED, handler);
  }

  public onBookingCompleted(handler: (payload: BookingCompletedPayload) => void): void {
    this.on(BookingEvent.COMPLETED, handler);
  }

  public onBookingCancelled(handler: (payload: BookingCancelledPayload) => void): void {
    this.on(BookingEvent.CANCELLED, handler);
  }

  public onNoDriversAvailable(handler: (payload: { bookingId: string }) => void): void {
    this.on(BookingEvent.NO_DRIVERS, handler);
  }

  public onDriverWentOnline(handler: (payload: { driverId: string; timestamp: Date }) => void): void {
    this.on(DriverEvent.WENT_ONLINE, handler);
  }

  public onDriverWentOffline(handler: (payload: { driverId: string; timestamp: Date }) => void): void {
    this.on(DriverEvent.WENT_OFFLINE, handler);
  }

  public onDriverLocationUpdated(handler: (payload: DriverLocationUpdatedPayload) => void): void {
    this.on(DriverEvent.LOCATION_UPDATED, handler);
  }

  public onDriverAcceptedBooking(handler: (payload: { driverId: string; bookingId: string; timestamp: Date }) => void): void {
    this.on(DriverEvent.ACCEPTED_BOOKING, handler);
  }

  public onDriverRejectedBooking(handler: (payload: { driverId: string; bookingId: string; timestamp: Date }) => void): void {
    this.on(DriverEvent.REJECTED_BOOKING, handler);
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Example usage:
/*
// In matchingService.ts:
import { eventBus } from './eventBus';

export const autoMatchBooking = async (bookingId: string) => {
  // ... matching logic ...
  
  eventBus.emitDriverMatched({
    bookingId,
    drivers: matchedDrivers.map(d => ({
      driverId: d.driverId,
      distance: d.distance,
      name: d.name
    }))
  });
};

// In a listener file (e.g., notificationService.ts):
import { eventBus } from './eventBus';

eventBus.onDriverMatched((payload) => {
  console.log(`Found ${payload.drivers.length} drivers for booking ${payload.bookingId}`);
  // Send push notifications, update analytics, etc.
});

eventBus.onBookingCompleted((payload) => {
  console.log(`Booking ${payload.bookingId} completed. Driver earned ${payload.driverEarning}`);
  // Update earnings, send receipt, notify customer, etc.
});
*/
