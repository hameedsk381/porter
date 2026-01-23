import axios from 'axios';

// For development, use your local machine IP if testing on physical device
// Example: const BASE_URL = 'http://192.168.1.100:5000/api';
const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const authAPI = {
    sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
    verifyOTP: (phone: string, otp: string, role: string) =>
        api.post('/auth/verify-otp', { phone, otp, role }),
    getProfile: () => api.get('/auth/profile'),
};

export const bookingAPI = {
    getEstimates: (data: any) => api.post('/bookings/estimates', data),
    createBooking: (data: any) => api.post('/bookings', data),
    getBookings: () => api.get('/bookings/my-bookings'),
    getBookingDetails: (id: string) => api.get(`/bookings/${id}`),
};

export const walletAPI = {
    getBalance: () => api.get('/wallet/balance'),
    getTransactions: (page = 1) => api.get(`/wallet/transactions?page=${page}`),
};

export const promoAPI = {
    validate: (data: { code: string; amount: number; vehicleType?: string; city?: string }) =>
        api.post('/promo/validate', data),
};

export const notificationAPI = {
    getNotifications: (page = 1, unreadOnly = false) =>
        api.get(`/notifications?page=${page}&unreadOnly=${unreadOnly}`),
    markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
