import admin from 'firebase-admin';
import { Server } from 'socket.io';
import User from '../models/User';
import { env } from '../config/env.validation';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.log('⚠️ Firebase not configured - push notifications disabled');
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
};

initializeFirebase();

// Notification Types
export enum NotificationType {
  // Booking notifications
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVING = 'DRIVER_ARRIVING',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',

  // Driver notifications
  NEW_BOOKING_REQUEST = 'NEW_BOOKING_REQUEST',
  BOOKING_TIMEOUT = 'BOOKING_TIMEOUT',
  BOOKING_CANCELLED_BY_CUSTOMER = 'BOOKING_CANCELLED_BY_CUSTOMER',

  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  WALLET_CREDITED = 'WALLET_CREDITED',

  // Promotional
  PROMO_CODE_APPLIED = 'PROMO_CODE_APPLIED',
  NEW_OFFER = 'NEW_OFFER',

  // System
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  RATING_RECEIVED = 'RATING_RECEIVED',
}

// Notification Templates
const notificationTemplates: Record<NotificationType, { title: string; body: string }> = {
  [NotificationType.BOOKING_CREATED]: {
    title: 'Booking Confirmed! 🎉',
    body: 'Your booking #{bookingId} has been created. Finding a driver for you...',
  },
  [NotificationType.BOOKING_CONFIRMED]: {
    title: 'Booking Confirmed',
    body: 'Your booking #{bookingId} is confirmed and ready.',
  },
  [NotificationType.DRIVER_ASSIGNED]: {
    title: 'Driver Assigned! 🚗',
    body: '{driverName} is on the way. Vehicle: {vehicleNumber}',
  },
  [NotificationType.DRIVER_ARRIVING]: {
    title: 'Driver Arriving Soon',
    body: '{driverName} will arrive in {eta} minutes',
  },
  [NotificationType.TRIP_STARTED]: {
    title: 'Trip Started 🛣️',
    body: 'Your trip has begun. Track your goods in real-time.',
  },
  [NotificationType.TRIP_COMPLETED]: {
    title: 'Trip Completed! ✅',
    body: 'Your trip is complete. Total fare: ₹{fare}',
  },
  [NotificationType.BOOKING_CANCELLED]: {
    title: 'Booking Cancelled',
    body: 'Your booking #{bookingId} has been cancelled.',
  },
  [NotificationType.NEW_BOOKING_REQUEST]: {
    title: 'New Trip Request! 💰',
    body: 'New booking from {pickup} to {drop}. Earn ₹{earnings}',
  },
  [NotificationType.BOOKING_TIMEOUT]: {
    title: 'Booking Expired',
    body: 'The booking request has timed out.',
  },
  [NotificationType.BOOKING_CANCELLED_BY_CUSTOMER]: {
    title: 'Booking Cancelled',
    body: 'Customer cancelled the booking.',
  },
  [NotificationType.PAYMENT_RECEIVED]: {
    title: 'Payment Received 💰',
    body: '₹{amount} credited to your account.',
  },
  [NotificationType.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    body: 'Payment of ₹{amount} failed. Please try again.',
  },
  [NotificationType.REFUND_PROCESSED]: {
    title: 'Refund Processed',
    body: '₹{amount} refunded to your account.',
  },
  [NotificationType.WALLET_CREDITED]: {
    title: 'Wallet Credited 💳',
    body: '₹{amount} added to your wallet.',
  },
  [NotificationType.PROMO_CODE_APPLIED]: {
    title: 'Promo Applied! 🎁',
    body: 'You saved ₹{discount} with code {code}',
  },
  [NotificationType.NEW_OFFER]: {
    title: 'Special Offer! 🎉',
    body: '{offerMessage}',
  },
  [NotificationType.ACCOUNT_VERIFIED]: {
    title: 'Account Verified ✅',
    body: 'Your account has been verified successfully.',
  },
  [NotificationType.KYC_APPROVED]: {
    title: 'KYC Approved! 🎉',
    body: 'Your KYC verification is complete. You can start accepting trips.',
  },
  [NotificationType.KYC_REJECTED]: {
    title: 'KYC Rejected',
    body: 'Your KYC was rejected. Reason: {reason}',
  },
  [NotificationType.RATING_RECEIVED]: {
    title: 'New Rating ⭐',
    body: 'You received a {rating}-star rating from your recent trip.',
  },
};

// Notification Payload Interface
interface NotificationPayload {
  userId: string;
  type: NotificationType;
  data?: Record<string, string | number>;
  customTitle?: string;
  customBody?: string;
  imageUrl?: string;
  actionUrl?: string;
}

// Notification History Interface
interface NotificationRecord {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

class NotificationService {
  private io: Server | null = null;
  private notificationHistory: NotificationRecord[] = []; // In production, use MongoDB

  setSocketIO(io: Server) {
    this.io = io;
  }

  // Parse template with data
  private parseTemplate(template: string, data: Record<string, string | number>): string {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
    return result;
  }

  // Send push notification via FCM
  async sendPushNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const user = await User.findById(payload.userId).select('deviceInfo.fcmToken name');

      const fcmToken = user?.deviceInfo?.fcmToken;
      if (!fcmToken) {
        console.log(`⚠️ No device token for user ${payload.userId}`);
        return false;
      }

      const template = notificationTemplates[payload.type];
      const title = payload.customTitle || this.parseTemplate(template.title, payload.data || {});
      const body = payload.customBody || this.parseTemplate(template.body, payload.data || {});

      if (!firebaseInitialized) {
        console.log(`📱 [Mock Push] ${title}: ${body}`);
        return true;
      }

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
          imageUrl: payload.imageUrl,
        },
        data: {
          type: payload.type,
          actionUrl: payload.actionUrl || '',
          ...Object.fromEntries(
            Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
          ),
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'porter_notifications',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`✅ Push notification sent to ${user.name || payload.userId}`);

      // Save to history
      this.saveNotificationHistory({
        userId: payload.userId,
        type: payload.type,
        title,
        body,
        data: payload.data || {},
        read: false,
        createdAt: new Date(),
      });

      return true;
    } catch (error) {
      console.error('❌ Push notification failed:', error);
      return false;
    }
  }

  // Send in-app notification via Socket.IO
  sendInAppNotification(payload: NotificationPayload): boolean {
    if (!this.io) {
      console.log('⚠️ Socket.IO not initialized');
      return false;
    }

    const template = notificationTemplates[payload.type];
    const title = payload.customTitle || this.parseTemplate(template.title, payload.data || {});
    const body = payload.customBody || this.parseTemplate(template.body, payload.data || {});

    const notification = {
      id: `notif_${Date.now()}`,
      type: payload.type,
      title,
      body,
      data: payload.data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.io.to(`user:${payload.userId}`).emit('notification', notification);
    console.log(`📢 In-app notification sent to user ${payload.userId}`);

    return true;
  }

  // Send both push and in-app notification
  async sendNotification(payload: NotificationPayload): Promise<void> {
    await Promise.all([
      this.sendPushNotification(payload),
      this.sendInAppNotification(payload),
    ]);
  }

  // Batch send notifications
  async sendBatchNotifications(payloads: NotificationPayload[]): Promise<void> {
    await Promise.all(payloads.map(p => this.sendNotification(p)));
  }

  // Send notification to multiple users
  async sendToMultipleUsers(
    userIds: string[],
    type: NotificationType,
    data?: Record<string, string | number>
  ): Promise<void> {
    const payloads: NotificationPayload[] = userIds.map(userId => ({
      userId,
      type,
      data,
    }));
    await this.sendBatchNotifications(payloads);
  }

  // Save notification to history (in production, save to MongoDB)
  private saveNotificationHistory(record: NotificationRecord): void {
    this.notificationHistory.push(record);
    // Keep only last 1000 notifications in memory
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory = this.notificationHistory.slice(-1000);
    }
  }

  // Get user notifications
  getNotifications(userId: string, limit = 50): NotificationRecord[] {
    return this.notificationHistory
      .filter(n => n.userId === userId)
      .slice(-limit)
      .reverse();
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId?: string): void {
    this.notificationHistory.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });

    // Emit read status update
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notifications_read', { notificationId });
    }
  }

  // Get unread count
  getUnreadCount(userId: string): number {
    return this.notificationHistory.filter(n => n.userId === userId && !n.read).length;
  }

  // === Convenience Methods for Common Notifications ===

  async notifyDriverAssigned(customerId: string, driverName: string, vehicleNumber: string, bookingId: string) {
    await this.sendNotification({
      userId: customerId,
      type: NotificationType.DRIVER_ASSIGNED,
      data: { driverName, vehicleNumber, bookingId },
    });
  }

  async notifyNewBookingRequest(driverId: string, pickup: string, drop: string, earnings: number, bookingId: string) {
    await this.sendNotification({
      userId: driverId,
      type: NotificationType.NEW_BOOKING_REQUEST,
      data: { pickup, drop, earnings, bookingId },
    });
  }

  async notifyTripCompleted(customerId: string, fare: number, bookingId: string) {
    await this.sendNotification({
      userId: customerId,
      type: NotificationType.TRIP_COMPLETED,
      data: { fare, bookingId },
    });
  }

  async notifyPaymentReceived(userId: string, amount: number) {
    await this.sendNotification({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      data: { amount },
    });
  }

  async notifyKYCApproved(driverId: string) {
    await this.sendNotification({
      userId: driverId,
      type: NotificationType.KYC_APPROVED,
    });
  }

  async notifyKYCRejected(driverId: string, reason: string) {
    await this.sendNotification({
      userId: driverId,
      type: NotificationType.KYC_REJECTED,
      data: { reason },
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
