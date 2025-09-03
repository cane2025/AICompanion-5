import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { devRoutes } from "./routes/dev.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Use only dev routes
app.use("/api", devRoutes);
console.log("[routes] Using development routes with mock data");

// Serve static files from dist/public (built frontend)
app.use(express.static(path.join(__dirname, "../dist/public")));

// Serve all other routes to index.html (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, async () => {
  console.log("[express] serving on port", PORT);
  console.log("[dev] Development mode - using mock data");
  console.log("[dev] All advanced features available in production mode");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[shutdown] SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("[shutdown] Server closed");
    process.exit(0);
  });
});
