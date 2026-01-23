import axios from 'axios';

// For development, use your local machine IP if testing on physical device
const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authAPI = {
    sendOTP: (phone: string, role: string = 'driver') => api.post('/auth/send-otp', { phone, role }),
    verifyOTP: (phone: string, otp: string, role: string = 'driver') =>
        api.post('/auth/verify-otp', { phone, otp, role }),
    getProfile: () => api.get('/auth/profile'),
};

export const driverAPI = {
    updateLocation: (lat: number, lng: number, address: string) =>
        api.post('/drivers/location', { lat, lng, address }),
    toggleAvailability: (isAvailable: boolean) =>
        api.post('/drivers/availability', { isAvailable }),
    getEarnings: () => api.get('/drivers/earnings'),
    getTrips: () => api.get('/drivers/trips'),
};

export const walletAPI = {
    getBalance: () => api.get('/wallet/balance'),
    getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
    withdraw: (data: { amount: number; bankDetails: any; upiId?: string }) =>
        api.post('/wallet/withdraw', data),
};

export const notificationAPI = {
    getNotifications: (page = 1, unreadOnly = false) =>
        api.get(`/notifications?page=${page}&unreadOnly=${unreadOnly}`),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
