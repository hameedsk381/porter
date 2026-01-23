import express, { Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import Notification from '../models/Notification';

const router: Router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';

        const result = await (Notification as any).getUserNotifications(
            req.user.id,
            page,
            limit,
            unreadOnly
        );

        return res.json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Mark a single notification as read
router.patch('/:id/read', authenticateToken, async (req: any, res: Response) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ status: 'error', message: 'Notification not found' });
        }

        notification.read = true;
        notification.readAt = new Date();
        await notification.save();

        return res.json({
            status: 'success',
            message: 'Notification marked as read'
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: any, res: Response) => {
    try {
        await (Notification as any).markAllAsRead(req.user.id);
        return res.json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req: any, res: Response) => {
    try {
        const count = await (Notification as any).getUnreadCount(req.user.id);
        return res.json({
            status: 'success',
            data: { count }
        });
    } catch (error: any) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;
