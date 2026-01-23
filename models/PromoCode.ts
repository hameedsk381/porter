import mongoose, { Document, Schema, Types } from 'mongoose';

// Discount Types
export enum DiscountType {
    PERCENTAGE = 'percentage',
    FLAT = 'flat',
}

// Promo Code Status
export enum PromoCodeStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    EXPIRED = 'expired',
    EXHAUSTED = 'exhausted',
}

// Promo Code Scope
export enum PromoCodeScope {
    ALL = 'all',
    NEW_USERS = 'new_users',
    SPECIFIC_USERS = 'specific_users',
    FIRST_BOOKING = 'first_booking',
    VEHICLE_TYPE = 'vehicle_type',
    CITY = 'city',
}

// Usage Record Interface
export interface IUsageRecord {
    userId: Types.ObjectId;
    bookingId: Types.ObjectId;
    discountAmount: number;
    usedAt: Date;
}

// Promo Code Interface
export interface IPromoCode extends Document {
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscount?: number;
    minOrderValue: number;

    // Validity
    startDate: Date;
    endDate: Date;
    status: PromoCodeStatus;

    // Usage limits
    maxUsageCount: number;
    currentUsageCount: number;
    maxUsagePerUser: number;

    // Scope/Targeting
    scope: PromoCodeScope;
    applicableVehicleTypes?: string[];
    applicableCities?: string[];
    applicableUserIds?: Types.ObjectId[];

    // Usage records
    usageRecords: IUsageRecord[];

    // Metadata
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    isValid(): boolean;
    canBeUsedByUser(userId: Types.ObjectId): Promise<boolean>;
    calculateDiscount(orderValue: number): number;
    applyPromo(userId: Types.ObjectId, bookingId: Types.ObjectId, orderValue: number): Promise<number>;
}

// Usage Record Schema
const UsageRecordSchema = new Schema<IUsageRecord>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    },
    usedAt: {
        type: Date,
        default: Date.now,
    },
});

// Promo Code Schema
const PromoCodeSchema = new Schema<IPromoCode>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
        },
        description: {
            type: String,
            required: true,
            maxlength: 200,
        },
        discountType: {
            type: String,
            enum: Object.values(DiscountType),
            required: true,
        },
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },
        maxDiscount: {
            type: Number,
            min: 0,
        },
        minOrderValue: {
            type: Number,
            default: 0,
            min: 0,
        },
        startDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PromoCodeStatus),
            default: PromoCodeStatus.ACTIVE,
        },
        maxUsageCount: {
            type: Number,
            default: -1, // -1 means unlimited
        },
        currentUsageCount: {
            type: Number,
            default: 0,
        },
        maxUsagePerUser: {
            type: Number,
            default: 1,
        },
        scope: {
            type: String,
            enum: Object.values(PromoCodeScope),
            default: PromoCodeScope.ALL,
        },
        applicableVehicleTypes: [{
            type: String,
            enum: ['bike', 'auto', 'mini-truck', 'truck', 'large-truck'],
        }],
        applicableCities: [String],
        applicableUserIds: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
        }],
        usageRecords: [UsageRecordSchema],
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
PromoCodeSchema.index({ code: 1 });
PromoCodeSchema.index({ status: 1 });
PromoCodeSchema.index({ startDate: 1, endDate: 1 });
PromoCodeSchema.index({ 'usageRecords.userId': 1 });

// Pre-save hook to update status
PromoCodeSchema.pre('save', function (next) {
    const now = new Date();

    // Check if expired
    if (this.endDate < now && this.status === PromoCodeStatus.ACTIVE) {
        this.status = PromoCodeStatus.EXPIRED;
    }

    // Check if exhausted
    if (this.maxUsageCount > 0 && this.currentUsageCount >= this.maxUsageCount) {
        this.status = PromoCodeStatus.EXHAUSTED;
    }

    next();
});

// Method to check if promo is valid
PromoCodeSchema.methods.isValid = function (): boolean {
    const now = new Date();

    if (this.status !== PromoCodeStatus.ACTIVE) return false;
    if (this.isDeleted) return false;
    if (now < this.startDate || now > this.endDate) return false;
    if (this.maxUsageCount > 0 && this.currentUsageCount >= this.maxUsageCount) return false;

    return true;
};

// Method to check if user can use the promo
PromoCodeSchema.methods.canBeUsedByUser = async function (userId: Types.ObjectId): Promise<boolean> {
    if (!this.isValid()) return false;

    // Check user-specific usage limit
    const userUsageCount = this.usageRecords.filter(
        (record: IUsageRecord) => record.userId.toString() === userId.toString()
    ).length;

    if (userUsageCount >= this.maxUsagePerUser) return false;

    // Check scope restrictions
    switch (this.scope) {
        case PromoCodeScope.SPECIFIC_USERS:
            if (!this.applicableUserIds?.some((id: any) => id.toString() === userId.toString())) {
                return false;
            }
            break;

        case PromoCodeScope.NEW_USERS:
            // Need to check if user has any previous bookings
            const Booking = mongoose.model('Booking');
            const bookingCount = await Booking.countDocuments({ customer: userId });
            if (bookingCount > 0) return false;
            break;

        case PromoCodeScope.FIRST_BOOKING:
            // Need to check if user has used any promo before
            const previousPromoUse = await mongoose.model('PromoCode').findOne({
                'usageRecords.userId': userId,
            });
            if (previousPromoUse) return false;
            break;
    }

    return true;
};

// Method to calculate discount
PromoCodeSchema.methods.calculateDiscount = function (orderValue: number): number {
    if (orderValue < this.minOrderValue) return 0;

    let discount = 0;

    if (this.discountType === DiscountType.PERCENTAGE) {
        discount = (orderValue * this.discountValue) / 100;
    } else {
        discount = this.discountValue;
    }

    // Apply max discount cap
    if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
    }

    // Discount cannot exceed order value
    if (discount > orderValue) {
        discount = orderValue;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimal places
};

// Method to apply promo and record usage
PromoCodeSchema.methods.applyPromo = async function (
    userId: Types.ObjectId,
    bookingId: Types.ObjectId,
    orderValue: number
): Promise<number> {
    const canUse = await this.canBeUsedByUser(userId);
    if (!canUse) {
        throw new Error('This promo code cannot be used');
    }

    if (orderValue < this.minOrderValue) {
        throw new Error(`Minimum order value is ₹${this.minOrderValue}`);
    }

    const discount = this.calculateDiscount(orderValue);

    // Record usage
    this.usageRecords.push({
        userId,
        bookingId,
        discountAmount: discount,
        usedAt: new Date(),
    });

    this.currentUsageCount += 1;

    // Check if exhausted
    if (this.maxUsageCount > 0 && this.currentUsageCount >= this.maxUsageCount) {
        this.status = PromoCodeStatus.EXHAUSTED;
    }

    await this.save();

    return discount;
};

// Static method to validate promo code
PromoCodeSchema.statics.validateCode = async function (
    code: string,
    userId: Types.ObjectId,
    orderValue: number,
    vehicleType?: string,
    city?: string
): Promise<{ valid: boolean; discount: number; message: string; promo?: IPromoCode }> {
    const promo = await this.findOne({ code: code.toUpperCase(), isDeleted: false });

    if (!promo) {
        return { valid: false, discount: 0, message: 'Invalid promo code' };
    }

    if (!promo.isValid()) {
        if (promo.status === PromoCodeStatus.EXPIRED) {
            return { valid: false, discount: 0, message: 'This promo code has expired' };
        }
        if (promo.status === PromoCodeStatus.EXHAUSTED) {
            return { valid: false, discount: 0, message: 'This promo code has been fully redeemed' };
        }
        return { valid: false, discount: 0, message: 'This promo code is not active' };
    }

    const canUse = await promo.canBeUsedByUser(userId);
    if (!canUse) {
        return { valid: false, discount: 0, message: 'You have already used this promo code' };
    }

    if (orderValue < promo.minOrderValue) {
        return {
            valid: false,
            discount: 0,
            message: `Minimum order value is ₹${promo.minOrderValue}`
        };
    }

    // Check vehicle type restriction
    if (promo.applicableVehicleTypes?.length > 0 && vehicleType) {
        if (!promo.applicableVehicleTypes.includes(vehicleType)) {
            return {
                valid: false,
                discount: 0,
                message: 'This promo is not valid for the selected vehicle type'
            };
        }
    }

    // Check city restriction
    if (promo.applicableCities?.length > 0 && city) {
        if (!promo.applicableCities.includes(city.toLowerCase())) {
            return {
                valid: false,
                discount: 0,
                message: 'This promo is not valid in your city'
            };
        }
    }

    const discount = promo.calculateDiscount(orderValue);

    return {
        valid: true,
        discount,
        message: `You save ₹${discount}!`,
        promo,
    };
};

const PromoCode = mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
export default PromoCode;
