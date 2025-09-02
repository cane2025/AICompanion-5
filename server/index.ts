import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/api.js";
import { requestLogger, errorHandler, maintenanceMode } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Maintenance mode check
app.use(maintenanceMode);

// Health check
app.get("/api/health", (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || "1.0.0"
}));

// API routes
app.use("/api", apiRoutes);

// Serve static files from dist/public (built frontend)
app.use(express.static(path.join(__dirname, "../dist/public")));

// Serve all other routes to index.html (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[express] Server running on port ${PORT}`);
  console.log(`[express] Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`[express] Health check: http://localhost:${PORT}/api/health`);
});
