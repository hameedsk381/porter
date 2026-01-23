import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import Wallet from '../models/Wallet';

const router: Router = express.Router();

// Get wallet balance and recent transactions
router.get('/balance', authenticateToken, async (req: any, res: Response) => {
    try {
        const wallet = await Wallet.getOrCreateWallet(req.user.id, req.user.role);
        return res.json({
            status: 'success',
            data: {
                balance: wallet.balance,
                pendingBalance: wallet.pendingBalance,
                totalEarnings: wallet.totalEarnings,
                transactions: wallet.getTransactionHistory(1, 10)
            }
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get full transaction history
router.get('/transactions', authenticateToken, async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const wallet = await Wallet.getOrCreateWallet(req.user.id, req.user.role);
        const transactions = wallet.getTransactionHistory(page, limit);

        return res.json({
            status: 'success',
            data: {
                transactions,
                page,
                limit
            }
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Request withdrawal (Drivers only)
router.post('/withdraw', authenticateToken, async (req: any, res: Response) => {
    try {
        if (req.user.role !== 'driver') {
            return res.status(403).json({ status: 'error', message: 'Only drivers can request withdrawals' });
        }

        const { amount, bankDetails, upiId } = req.body;
        const wallet = await Wallet.getOrCreateWallet(req.user.id, 'driver');

        const request = await wallet.requestWithdrawal(amount, bankDetails, upiId);

        return res.json({
            status: 'success',
            message: 'Withdrawal request submitted successfully',
            data: request
        });
    } catch (error: any) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
});

export default router;
