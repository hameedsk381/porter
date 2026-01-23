import { create } from 'zustand';
import { walletAPI } from '../services/api';

interface Transaction {
    _id: string;
    type: 'credit' | 'debit';
    category: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
}

interface WalletState {
    balance: number;
    pendingBalance: number;
    totalEarnings: number;
    transactions: Transaction[];
    isLoading: boolean;
    error: string | null;
    fetchBalance: () => Promise<void>;
    fetchTransactions: (page?: number) => Promise<void>;
    withdraw: (amount: number, bankDetails: any, upiId?: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    balance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    transactions: [],
    isLoading: false,
    error: null,

    fetchBalance: async () => {
        try {
            set({ isLoading: true, error: null });
            const response = await walletAPI.getBalance();
            const { balance, pendingBalance, totalEarnings } = response.data.data;
            set({ balance, pendingBalance, totalEarnings, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchTransactions: async (page: number = 1) => {
        try {
            set({ isLoading: true, error: null });
            const response = await walletAPI.getTransactions(page);
            const { transactions } = response.data.data;

            if (page === 1) {
                set({ transactions, isLoading: false });
            } else {
                set({
                    transactions: [...get().transactions, ...transactions],
                    isLoading: false
                });
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    withdraw: async (amount: number, bankDetails: any, upiId?: string) => {
        try {
            set({ isLoading: true, error: null });
            await walletAPI.withdraw({ amount, bankDetails, upiId });
            // Refresh balance after withdrawal
            const response = await walletAPI.getBalance();
            const { balance, pendingBalance, totalEarnings } = response.data.data;
            set({ balance, pendingBalance, totalEarnings, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },
}));
