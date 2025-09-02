import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.js";

export interface AuthenticatedRequest extends Request {
  token?: string;
  user?: any;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token saknas" });
    }

    const payload = authService.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ message: "Ogiltig eller utgången token" });
    }

    // Get user from database
    const user = await authService.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: "Användare inte hittad" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "Användarkontot är inaktiverat" });
    }

    // Add token and user to request
    req.token = token;
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Ett fel uppstod vid autentisering" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({ message: "Autentisering krävs" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Otillräckliga behörigheter" });
    }

    next();
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(["admin"])(req, res, next);
}

export function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(["admin", "staff"])(req, res, next);
}

export function requireViewer(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireRole(["admin", "staff", "viewer"])(req, res, next);
}

// Rate limiting middleware
export function rateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || "unknown";
    const now = Date.now();

    const clientRequests = requests.get(clientId);
    
    if (!clientRequests || now > clientRequests.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
    } else if (clientRequests.count < maxRequests) {
      clientRequests.count++;
      next();
    } else {
      res.status(429).json({ 
        message: "För många förfrågningar. Försök igen senare.",
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      });
    }
  };
}

// CORS middleware for API routes
export function corsOptions(req: Request, callback: Function): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000", "http://localhost:3001"];
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(new Error("CORS not allowed"));
  }
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "ERROR" : "INFO";
    
    console.log(`[${logLevel}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
}

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    res.status(400).json({ message: "Valideringsfel", errors: error.message });
  } else if (error.name === "UnauthorizedError") {
    res.status(401).json({ message: "Otillåten åtkomst" });
  } else if (error.name === "ForbiddenError") {
    res.status(403).json({ message: "Förbjuden åtkomst" });
  } else if (error.name === "NotFoundError") {
    res.status(404).json({ message: "Resurs inte hittad" });
  } else {
    res.status(500).json({ message: "Ett internt fel uppstod" });
  }
}

// Request validation middleware
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      res.status(400).json({ 
        message: "Ogiltig förfrågning", 
        errors: error instanceof Error ? error.message : "Valideringsfel" 
      });
    }
  };
}

// API key middleware for external integrations
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: "Ogiltig API-nyckel" });
  }

  next();
}

// Maintenance mode middleware
export function maintenanceMode(req: Request, res: Response, next: NextFunction): void {
  if (process.env.MAINTENANCE_MODE === "true") {
    return res.status(503).json({ 
      message: "Systemet är under underhåll. Försök igen senare.",
      estimatedDowntime: process.env.ESTIMATED_DOWNTIME || "Okänt"
    });
  }

  next();
}
