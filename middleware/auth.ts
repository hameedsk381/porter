import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { env } from '../config/env.validation';

// Extend the Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface TokenPayload extends JwtPayload {
  userId: string;
}

// Verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

// Check if user is admin
const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
  if (req.user && req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

// Check if user is driver
const requireDriver = (req: Request, res: Response, next: NextFunction): any => {
  if (req.user && req.user.role !== 'driver') {
    return res.status(403).json({
      status: 'error',
      message: 'Driver access required'
    });
  }
  next();
};

// Check if user is customer
const requireCustomer = (req: Request, res: Response, next: NextFunction): any => {
  if (req.user && req.user.role !== 'customer') {
    return res.status(403).json({
      status: 'error',
      message: 'Customer access required'
    });
  }
  next();
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Generate JWT tokens
const generateTokens = (userId: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { userId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRE } as SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRE } as SignOptions
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as TokenPayload;
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Alias for authenticateToken
const protect = authenticateToken;

export {
  authenticateToken,
  protect,
  requireAdmin,
  requireDriver,
  requireCustomer,
  optionalAuth,
  generateTokens,
  verifyRefreshToken,
  restrictTo,
};