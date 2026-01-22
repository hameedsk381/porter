import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('token');
        const socket = io(SOCKET_URL, {
            auth: { token },
            query: {
                userId: user._id,
                role: 'admin',
            },
        });

        socket.on('connect', () => {
            console.log('✅ Admin Socket connected:', socket.id);
            setIsConnected(true);

            socket.emit('join', {
                userId: user._id,
                role: 'admin',
            });
        });

        socket.on('disconnect', () => {
            console.log('❌ Admin Socket disconnected');
            setIsConnected(false);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
        };
    }, [user]);

    return { socket: socketRef.current, isConnected };
};
