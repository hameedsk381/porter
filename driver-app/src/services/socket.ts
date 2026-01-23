import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

const SOCKET_URL = 'http://localhost:5000'; // Replace with your server URL

export const useSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const { user, isAuthenticated } = useAuthStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            const socket = io(SOCKET_URL, {
                transports: ['websocket'],
                query: { userId: user._id }
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ (Driver) Connected to socket server');
                socket.emit('join', { userId: user._id, role: 'driver' });
            });

            socket.on('notification', (notification: any) => {
                addNotification(notification);
            });

            // New booking requests for drivers
            socket.on('booking:new_request', (data: any) => {
                console.log('New booking request received:', data);
            });

            socket.on('booking:cancelled', (data: any) => {
                console.log('Booking was cancelled/taken:', data);
            });

            return () => {
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [isAuthenticated, user]);

    return socketRef.current;
};
