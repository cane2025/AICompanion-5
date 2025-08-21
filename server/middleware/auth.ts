import { Request, Response, NextFunction } from 'express';

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
