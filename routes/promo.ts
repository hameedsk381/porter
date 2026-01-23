import express, { Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import PromoCode from '../models/PromoCode';

const router: Router = express.Router();

// Validate a promo code
router.post('/validate', authenticateToken, async (req: any, res: Response) => {
    try {
        const { code, amount, vehicleType, city } = req.body;

        if (!code) {
            return res.status(400).json({ status: 'error', message: 'Promo code is required' });
        }

        const validation = await (PromoCode as any).validateCode(
            code,
            req.user.id,
            amount,
            vehicleType,
            city
        );

        if (!validation.valid) {
            return res.status(400).json({
                status: 'error',
                message: validation.message
            });
        }

        return res.json({
            status: 'success',
            data: {
                discount: validation.discount,
                message: validation.message,
                code: validation.promo?.code
            }
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Admin: Create promo code
router.post('/admin/create', authenticateToken, async (req: any, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Access denied' });
        }

        const promoData = {
            ...req.body,
            createdBy: req.user.id
        };

        const promo = await PromoCode.create(promoData);

        return res.status(201).json({
            status: 'success',
            data: promo
        });
    } catch (error: any) {
        return res.status(400).json({ status: 'error', message: error.message });
    }
});

// Admin: List all promo codes
router.get('/admin/list', authenticateToken, async (req: any, res: Response) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Access denied' });
        }

        const promos = await PromoCode.find({ isDeleted: false }).sort({ createdAt: -1 });

        return res.json({
            status: 'success',
            data: promos
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;
