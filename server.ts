// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// @ts-ignore
import xss from 'xss-clean';

import { env } from './config/env.validation';
import connectDB, { redisClient } from './config/database';
import { createServer, Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import bookingRoutes from './routes/bookings';
import driverRoutes from './routes/drivers';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import driverApiRoutes from './routes/driver';
import walletRoutes from './routes/wallet';
import promoRoutes from './routes/promo';
import notificationRoutes from './routes/notifications';
import './services/eventBus'; // Initialize event listeners
import notificationService from './services/notificationService';

// Import middleware
import errorHandler from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { requestLogger, slowRequestLogger, errorLogger } from './middleware/requestLogger';

interface CustomSocket extends Socket {
  userId?: string;
}

interface BookingStatusData {
  bookingId: string;
  status: string;
  userId: string;
}

interface DriverLocationData {
  driverId: string;
  location: {
    lat: number;
    lng: number;
  };
  bookingId: string;
}

const app: Application = express();
const server: HttpServer = createServer(app);

// Initialize Socket.IO
const io: Server = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
  }
});

// Initialize Notification Service with IO
notificationService.setSocketIO(io);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(requestLogger);
app.use(slowRequestLogger(1000)); // Log requests slower than 1 second

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/bookings', authenticateToken, bookingRoutes);
app.use('/api/drivers', authenticateToken, driverRoutes);
app.use('/api/driver', driverApiRoutes); // New driver API routes (has its own auth)
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/wallet', authenticateToken, walletRoutes);
app.use('/api/promo', promoRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Socket.IO connection handling
io.on('connection', (socket: CustomSocket) => {
  console.log('User connected:', socket.id);

  // Join user to their room for personalized updates
  socket.on('join', (data: { userId: string; role?: string }) => {
    const { userId, role } = data;

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room for drivers
    if (role === 'driver') {
      socket.join(`driver:${userId}`);
    }

    // Join admin-specific room for global updates
    if (role === 'admin') {
      socket.join('admins');
      console.log(`Admin ${userId} joined admins room`);
    }

    console.log(`User ${userId} (${role || 'customer'}) joined room`);
  });

  // Join booking room for real-time tracking
  socket.on('join-booking', (bookingId: string) => {
    socket.join(`booking:${bookingId}`);
    console.log(`Socket ${socket.id} joined booking room: ${bookingId}`);
  });

  // Leave booking room
  socket.on('leave-booking', (bookingId: string) => {
    socket.leave(`booking:${bookingId}`);
    console.log(`Socket ${socket.id} left booking room: ${bookingId}`);
  });

  // Handle driver location updates
  socket.on('driver-location', (data: DriverLocationData) => {
    const { driverId, location, bookingId } = data;
    // Broadcast location to relevant users
    if (bookingId) {
      socket.to(bookingId).emit('driver-location-update', {
        driverId,
        location,
        timestamp: new Date()
      });
    }
  });

  // Enhanced driver location updates
  socket.on('driver:location_update', (data: any) => {
    const { bookingId, location, heading } = data;

    if (bookingId) {
      // Broadcast to booking room for customer tracking
      io.to(`booking:${bookingId}`).emit('driver:location_update', {
        location,
        heading,
        timestamp: new Date().toISOString(),
      });
    }

    // Always broadcast to admins for the real-time fleet map
    io.to('admins').emit('admin:driver_location', {
      driverId: (socket as any).userId || data.driverId,
      location,
      heading,
      status: bookingId ? 'on_trip' : 'available',
      timestamp: new Date().toISOString(),
    });
  });

  // Handle booking status updates
  socket.on('booking-status', (data: BookingStatusData) => {
    const { bookingId, status, userId } = data;
    socket.to(userId).emit('booking-status-update', {
      bookingId,
      status,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Error logging middleware (before error handler)
app.use(errorLogger);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT: number = env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export { app, server, io };