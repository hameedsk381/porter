import axios from 'axios';
import Constants from 'expo-constants';

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

export default api;
