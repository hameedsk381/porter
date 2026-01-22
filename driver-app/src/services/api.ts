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

export default api;
