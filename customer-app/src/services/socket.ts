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
            // Initialize socket
            const socket = io(SOCKET_URL, {
                transports: ['websocket'],
                query: { userId: user._id }
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('✅ Connected to socket server');
                socket.emit('join', { userId: user._id, role: user.role });
            });

            socket.on('disconnect', () => {
                console.log('❌ Disconnected from socket server');
            });

            // Generic notification listener
            socket.on('notification', (notification: any) => {
                addNotification(notification);
            });

            // Booking specific updates
            socket.on('booking:driver_assigned', (data: any) => {
                console.log('Driver assigned:', data);
            });

            socket.on('driver:location_update', (data: any) => {
                // Future implementation for tracking
            });

            return () => {
                socket.disconnect();
                socketRef.current = null;
            };
        }
    }, [isAuthenticated, user]);

    return socketRef.current;
};
