import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db.js';
import { users } from '../../shared/schema.js';

export function devAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // In development, accept any token or create one if it doesn't exist
  const cookieToken = (req.cookies && (req.cookies.devToken as string)) || undefined;
  const headerToken = (req.headers['x-dev-token'] as string) || undefined;
  const token = headerToken || cookieToken || `dev-${Date.now()}`;

  // Set user in request
  (req as any).user = {
    id: token,
    role: 'admin' // In dev, everyone is admin
  };

  // Set token in response for convenience (except on login route), and avoid duplicate Set-Cookie if already same value
  if (req.path !== '/api/auth/login' && cookieToken !== token) {
    res.cookie('devToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  next();
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip auth for login and health endpoints
    if (req.path === '/api/auth/login' || req.path === '/api/health') {
      return next();
    }

    const token = req.cookies?.authToken || req.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token by looking up user
    const user = await db.select().from(users).where(eq(users.id, token)).limit(1);
    
    if (user.length === 0 || !user[0].isActive) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Set user in request
    (req as any).user = {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
