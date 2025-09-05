import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic } from "./vite.js";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Register real API routes and optional websocket
const httpServer = await registerRoutes(app);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "development") {
  await setupVite(app, httpServer);
} else {
  serveStatic(app);
}

httpServer.listen(PORT, () => console.log("[express] serving on port", PORT));
