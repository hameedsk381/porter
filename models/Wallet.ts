import mongoose, { Document, Schema, Types } from 'mongoose';

// Transaction Types
export enum TransactionType {
    CREDIT = 'credit',
    DEBIT = 'debit',
}

// Transaction Categories
export enum TransactionCategory {
    TRIP_EARNING = 'trip_earning',
    TRIP_PAYMENT = 'trip_payment',
    BONUS = 'bonus',
    INCENTIVE = 'incentive',
    REFERRAL = 'referral',
    CASHBACK = 'cashback',
    WALLET_TOPUP = 'wallet_topup',
    WITHDRAWAL = 'withdrawal',
    REFUND = 'refund',
    PROMO_CREDIT = 'promo_credit',
    PENALTY = 'penalty',
    ADJUSTMENT = 'adjustment',
}

// Transaction Status
export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REVERSED = 'reversed',
}

// Withdrawal Status
export enum WithdrawalStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

// Transaction Interface
export interface ITransaction {
    _id?: Types.ObjectId;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    balanceAfter: number;
    description: string;
    referenceId?: string;
    referenceType?: 'booking' | 'payment' | 'withdrawal' | 'promo' | 'referral';
    status: TransactionStatus;
    metadata?: Record<string, any>;
    createdAt: Date;
}

// Withdrawal Request Interface
export interface IWithdrawalRequest {
    _id?: Types.ObjectId;
    amount: number;
    bankDetails: {
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
        bankName: string;
    };
    upiId?: string;
    status: WithdrawalStatus;
    processedAt?: Date;
    transactionId?: string;
    failureReason?: string;
    createdAt: Date;
}

// Wallet Interface
export interface IWallet extends Document {
    userId: Types.ObjectId;
    userType: 'customer' | 'driver';
    balance: number;
    pendingBalance: number;
    totalEarnings: number;
    totalWithdrawals: number;
    transactions: ITransaction[];
    withdrawalRequests: IWithdrawalRequest[];
    isActive: boolean;
    lastTransactionAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Methods
    credit(amount: number, category: TransactionCategory, description: string, referenceId?: string, referenceType?: string): Promise<IWallet>;
    debit(amount: number, category: TransactionCategory, description: string, referenceId?: string, referenceType?: string): Promise<IWallet>;
    requestWithdrawal(amount: number, bankDetails: IWithdrawalRequest['bankDetails'], upiId?: string): Promise<IWithdrawalRequest>;
    getTransactionHistory(page: number, limit: number): ITransaction[];
    getPendingWithdrawals(): IWithdrawalRequest[];
}

export interface IWalletModel extends mongoose.Model<IWallet> {
    getOrCreateWallet(userId: Types.ObjectId | string, userType: string): Promise<IWallet>;
}

// Transaction Schema
const TransactionSchema = new Schema<ITransaction>({
    type: {
        type: String,
        enum: Object.values(TransactionType),
        required: true,
    },
    category: {
        type: String,
        enum: Object.values(TransactionCategory),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    referenceId: String,
    referenceType: {
        type: String,
        enum: ['booking', 'payment', 'withdrawal', 'promo', 'referral'],
    },
    status: {
        type: String,
        enum: Object.values(TransactionStatus),
        default: TransactionStatus.COMPLETED,
    },
    metadata: Schema.Types.Mixed,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Withdrawal Request Schema
const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>({
    amount: {
        type: Number,
        required: true,
        min: 100, // Minimum withdrawal amount
    },
    bankDetails: {
        accountHolderName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true },
        bankName: { type: String, required: true },
    },
    upiId: String,
    status: {
        type: String,
        enum: Object.values(WithdrawalStatus),
        default: WithdrawalStatus.PENDING,
    },
    processedAt: Date,
    transactionId: String,
    failureReason: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Wallet Schema
const WalletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        userType: {
            type: String,
            enum: ['customer', 'driver'],
            required: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },
        pendingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        totalWithdrawals: {
            type: Number,
            default: 0,
        },
        transactions: [TransactionSchema],
        withdrawalRequests: [WithdrawalRequestSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
        lastTransactionAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
WalletSchema.index({ userId: 1 });
WalletSchema.index({ userType: 1 });
WalletSchema.index({ 'transactions.createdAt': -1 });
WalletSchema.index({ 'withdrawalRequests.status': 1 });

// Credit Method
WalletSchema.methods.credit = async function (
    amount: number,
    category: TransactionCategory,
    description: string,
    referenceId?: string,
    referenceType?: string
): Promise<IWallet> {
    if (amount <= 0) {
        throw new Error('Credit amount must be positive');
    }

    this.balance += amount;

    if ([TransactionCategory.TRIP_EARNING, TransactionCategory.BONUS, TransactionCategory.INCENTIVE].includes(category)) {
        this.totalEarnings += amount;
    }

    const transaction: ITransaction = {
        type: TransactionType.CREDIT,
        category,
        amount,
        balanceAfter: this.balance,
        description,
        referenceId,
        referenceType: referenceType as any,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
    };

    this.transactions.push(transaction);
    this.lastTransactionAt = new Date();

    // Keep only last 500 transactions in embedded array
    if (this.transactions.length > 500) {
        this.transactions = this.transactions.slice(-500);
    }

    return await this.save();
};

// Debit Method
WalletSchema.methods.debit = async function (
    amount: number,
    category: TransactionCategory,
    description: string,
    referenceId?: string,
    referenceType?: string
): Promise<IWallet> {
    if (amount <= 0) {
        throw new Error('Debit amount must be positive');
    }

    if (this.balance < amount) {
        throw new Error('Insufficient wallet balance');
    }

    this.balance -= amount;

    if (category === TransactionCategory.WITHDRAWAL) {
        this.totalWithdrawals += amount;
    }

    const transaction: ITransaction = {
        type: TransactionType.DEBIT,
        category,
        amount,
        balanceAfter: this.balance,
        description,
        referenceId,
        referenceType: referenceType as any,
        status: TransactionStatus.COMPLETED,
        createdAt: new Date(),
    };

    this.transactions.push(transaction);
    this.lastTransactionAt = new Date();

    // Keep only last 500 transactions in embedded array
    if (this.transactions.length > 500) {
        this.transactions = this.transactions.slice(-500);
    }

    return await this.save();
};

// Request Withdrawal Method
WalletSchema.methods.requestWithdrawal = async function (
    amount: number,
    bankDetails: IWithdrawalRequest['bankDetails'],
    upiId?: string
): Promise<IWithdrawalRequest> {
    const MIN_WITHDRAWAL = 100;
    const MAX_WITHDRAWAL = 50000;

    if (amount < MIN_WITHDRAWAL) {
        throw new Error(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`);
    }

    if (amount > MAX_WITHDRAWAL) {
        throw new Error(`Maximum withdrawal amount is ₹${MAX_WITHDRAWAL}`);
    }

    if (this.balance < amount) {
        throw new Error('Insufficient wallet balance');
    }

    // Check for pending withdrawals
    const pendingWithdrawals = this.withdrawalRequests.filter(
        (w: IWithdrawalRequest) => w.status === WithdrawalStatus.PENDING || w.status === WithdrawalStatus.PROCESSING
    );

    if (pendingWithdrawals.length > 0) {
        throw new Error('You have a pending withdrawal request. Please wait for it to be processed.');
    }

    // Deduct from balance and add to pending
    this.balance -= amount;
    this.pendingBalance += amount;

    const withdrawalRequest: IWithdrawalRequest = {
        amount,
        bankDetails,
        upiId,
        status: WithdrawalStatus.PENDING,
        createdAt: new Date(),
    };

    this.withdrawalRequests.push(withdrawalRequest);
    await this.save();

    return this.withdrawalRequests[this.withdrawalRequests.length - 1];
};

// Get Transaction History
WalletSchema.methods.getTransactionHistory = function (page = 1, limit = 20): ITransaction[] {
    const start = (page - 1) * limit;
    return this.transactions
        .slice()
        .reverse()
        .slice(start, start + limit);
};

// Get Pending Withdrawals
WalletSchema.methods.getPendingWithdrawals = function (): IWithdrawalRequest[] {
    return this.withdrawalRequests.filter(
        (w: IWithdrawalRequest) => w.status === WithdrawalStatus.PENDING || w.status === WithdrawalStatus.PROCESSING
    );
};

// Static method to get or create wallet
WalletSchema.statics.getOrCreateWallet = async function (
    userId: Types.ObjectId,
    userType: 'customer' | 'driver'
): Promise<IWallet> {
    let wallet = await this.findOne({ userId });

    if (!wallet) {
        wallet = await this.create({ userId, userType });
    }

    return wallet;
};

const Wallet = mongoose.model<IWallet, IWalletModel>('Wallet', WalletSchema);
export default Wallet;
