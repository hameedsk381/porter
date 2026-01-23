import { create } from 'zustand';
import { notificationAPI } from '../services/api';

interface Notification {
    _id: string;
    type: string;
    title: string;
    body: string;
    data?: any;
    read: boolean;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: (page?: number, unreadOnly?: boolean) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async (page: number = 1, unreadOnly: boolean = false) => {
        try {
            set({ isLoading: true, error: null });
            const response = await notificationAPI.getNotifications(page, unreadOnly);
            const { notifications, unreadCount } = response.data.data;

            if (page === 1) {
                set({ notifications, unreadCount, isLoading: false });
            } else {
                set({
                    notifications: [...get().notifications, ...notifications],
                    unreadCount,
                    isLoading: false
                });
            }
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            set({ unreadCount: response.data.data.count });
        } catch (err: any) {
            console.error('Failed to fetch unread count', err);
        }
    },

    markAsRead: async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
            set({
                notifications: get().notifications.map((n: Notification) =>
                    n._id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, get().unreadCount - 1)
            });
        } catch (err: any) {
            console.error('Failed to mark notification as read', err);
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationAPI.markAllAsRead();
            set({
                notifications: get().notifications.map((n: Notification) => ({ ...n, read: true })),
                unreadCount: 0
            });
        } catch (err: any) {
            console.error('Failed to mark all as read', err);
        }
    },

    addNotification: (notification: Notification) => {
        set({
            notifications: [notification, ...get().notifications],
            unreadCount: get().unreadCount + 1
        });
    }
}));
