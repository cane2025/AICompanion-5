import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { log } from "./vite.js";
import devRoutes from "./routes/dev";
import { devAuthMiddleware } from "./middleware/auth";

import path from "node:path";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: [
    "http://127.0.0.1:5175",
    "http://localhost:5175",
    "http://127.0.0.1:3001",
    "http://localhost:3001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Dev-Token"],
};

app.use(cors(corsOptions));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  try {
    const body = req.body ? JSON.stringify(req.body) : "";
    log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${body}`);
  } catch (error) {
    log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} [Body not logged]`
    );
  }
  next();
});

// Health check is handled by devRoutes

// Apply development routes
app.use(devRoutes);

// Development-only routes
if (process.env.NODE_ENV !== "production") {
  // Development info endpoint
  app.get("/api/dev/info", (_req: Request, res: Response) => {
    res.json({
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    });
  });
}

// Error handling middleware (must be last)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Start the server
const PORT = process.env.PORT || 3001;

// In production, serve static files (no Vite dev server in development)
if (process.env.NODE_ENV === "production") {
  // In production, serve static files
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Handle SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

const server = app.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
  log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle server errors
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: Error | any) => {
  console.error("Unhandled Rejection at:", reason.stack || reason);
  // Consider restarting the server here in production
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  // Consider restarting the server here in production
  process.exit(1);
});

export default app;
