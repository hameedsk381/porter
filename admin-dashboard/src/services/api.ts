import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    sendOTP: (phone: string) => api.post('/auth/send-otp', { phone }),
    verifyOTP: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
    logout: () => api.post('/auth/logout'),
};

export const adminAPI = {
    getDashboard: (period = 'month') => api.get(`/admin/dashboard?period=${period}`),
    getUsers: (params: any) => api.get('/admin/users', { params }),
    getDrivers: (params: any) => api.get('/admin/drivers', { params }),
    getBookings: (params: any) => api.get('/admin/bookings', { params }),
    getPayments: (params: any) => api.get('/admin/payments', { params }),
    updateUserStatus: (userId: string, isActive: boolean) => api.put(`/admin/users/${userId}/status`, { isActive }),
    approveDriver: (driverId: string) => api.put(`/admin/drivers/${driverId}/kyc`, { status: 'approved' }),
    rejectDriver: (driverId: string, reason: string) => api.put(`/admin/drivers/${driverId}/kyc`, { status: 'rejected', reason }),
};

export default api;
