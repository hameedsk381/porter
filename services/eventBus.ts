import { EventEmitter } from 'events';
import notificationService from './notificationService';
import Booking from '../models/Booking';
import User from '../models/User';
import Wallet, { TransactionCategory } from '../models/Wallet';

export enum AppEventType {
  BOOKING_REQUESTED = 'booking.requested',
  BOOKING_ACCEPTED = 'booking.accepted',
  BOOKING_CANCELLED = 'booking.cancelled',
  TRIP_STARTED = 'trip.started',
  TRIP_COMPLETED = 'trip.completed',
  PAYMENT_COMPLETED = 'payment.completed',
  DRIVER_KYC_UPDATED = 'driver.kyc.updated',
  USER_REGISTERED = 'user.registered'
}

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // 1. Booking Requested -> Send notifications to nearby drivers (Handled by matching service logic usually, but can log here)
    this.on(AppEventType.BOOKING_REQUESTED, async (data) => {
      console.log(`[EventBus] Booking Requested: ${data.bookingId}`);
    });

    // 2. Booking Accepted -> Notify Customer
    this.on(AppEventType.BOOKING_ACCEPTED, async (data) => {
      const { bookingId, driverId } = data;
      const booking = await Booking.findById(bookingId).populate('customer');
      const driver = await User.findById(driverId);

      if (booking && driver) {
        await notificationService.notifyDriverAssigned(
          booking.customer.toString(),
          driver.name,
          driver.driverProfile?.vehicleNumber || 'N/A',
          bookingId
        );
      }
    });

    // 3. Trip Completed -> Calculate Earnings and Update Wallets
    this.on(AppEventType.TRIP_COMPLETED, async (data) => {
      const { bookingId } = data;
      const booking = await Booking.findById(bookingId);

      if (booking && booking.status === 'completed') {
        const fare = booking.fare.total;
        const driverEarnings = fare * 0.8; // 80/20 split

        // Update Driver Wallet
        if (booking.driver) {
          const wallet = await Wallet.getOrCreateWallet(booking.driver, 'driver');
          await wallet.credit(
            driverEarnings,
            TransactionCategory.TRIP_EARNING,
            `Earnings for trip #${bookingId}`,
            bookingId,
            'booking'
          );
        }

        // Notify Customer
        await notificationService.notifyTripCompleted(
          booking.customer.toString(),
          fare,
          bookingId
        );
      }
    });

    // 4. KYC Updated
    this.on(AppEventType.DRIVER_KYC_UPDATED, async (data) => {
      const { driverId, status, reason } = data;
      if (status === 'verified') {
        await notificationService.notifyKYCApproved(driverId);
      } else if (status === 'rejected') {
        await notificationService.notifyKYCRejected(driverId, reason || 'Document mismatch');
      }
    });
  }

  public publish(event: AppEventType, data: any) {
    this.emit(event, data);
  }
}

const eventBus = new EventBus();
export default eventBus;
