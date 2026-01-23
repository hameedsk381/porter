import mongoose, { Document, Schema, Types } from 'mongoose';

export enum NotificationType {
    BOOKING_CREATED = 'BOOKING_CREATED',
    BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
    DRIVER_ARRIVING = 'DRIVER_ARRIVING',
    TRIP_STARTED = 'TRIP_STARTED',
    TRIP_COMPLETED = 'TRIP_COMPLETED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    NEW_BOOKING_REQUEST = 'NEW_BOOKING_REQUEST',
    BOOKING_TIMEOUT = 'BOOKING_TIMEOUT',
    BOOKING_CANCELLED_BY_CUSTOMER = 'BOOKING_CANCELLED_BY_CUSTOMER',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    REFUND_PROCESSED = 'REFUND_PROCESSED',
    WALLET_CREDITED = 'WALLET_CREDITED',
    ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
    KYC_APPROVED = 'KYC_APPROVED',
    KYC_REJECTED = 'KYC_REJECTED',
    RATING_RECEIVED = 'RATING_RECEIVED',
    SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface INotification extends Document {
    userId: Types.ObjectId;
    type: NotificationType;
    title: string;
    body: string;
    imageUrl?: string;
    actionUrl?: string;
    data?: Record<string, any>;
    priority: NotificationPriority;
    read: boolean;
    readAt?: Date;
    pushSent: boolean;
    pushSentAt?: Date;
    createdAt: Date;
    expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            required: true
        },
        title: {
            type: String,
            required: true,
            maxlength: 100
        },
        body: {
            type: String,
            required: true,
            maxlength: 500
        },
        imageUrl: String,
        actionUrl: String,
        data: Schema.Types.Mixed,
        priority: {
            type: String,
            enum: Object.values(NotificationPriority),
            default: NotificationPriority.MEDIUM
        },
        read: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: Date,
        pushSent: {
            type: Boolean,
            default: false
        },
        pushSentAt: Date,
        expiresAt: Date
    },
    {
        timestamps: true
    }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
