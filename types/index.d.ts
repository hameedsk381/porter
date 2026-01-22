// Type declarations for route modules
declare module './routes/auth' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/users' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/bookings' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/drivers' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/payments' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

declare module './routes/admin' {
  import { Router } from 'express';
  const router: Router;
  export default router;
}

// Type declarations for middleware modules
declare module './middleware/errorHandler' {
  import { ErrorRequestHandler } from 'express';
  const errorHandler: ErrorRequestHandler;
  export default errorHandler;
}

declare module './middleware/auth' {
  import { RequestHandler } from 'express';
  export const authenticateToken: RequestHandler;
  export function generateTokens(userId: string): { accessToken: string; refreshToken: string };
  export function verifyRefreshToken(token: string): { userId: string } | null;
}