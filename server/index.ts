import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { devRoutes } from "./routes/dev";
import { registerRoutes } from "./routes.js";
import { devAuthMiddleware } from "./middleware/auth.js";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Development auth middleware to simulate sessions
app.use(devAuthMiddleware);

// Register real API routes
await registerRoutes(app);

// Also mount dev routes under /api/dev for compatibility/testing
app.use("/api/dev", devRoutes);

// In development, run Vite middleware; otherwise serve static build
if (process.env.NODE_ENV !== "production") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log("[express] serving on port", PORT));
