import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { devRoutes } from "./routes/dev.js";
import { databaseRoutes } from "./routes/database.js";
import { advancedRoutes } from "./routes/advanced.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { userRoutes } from "./routes/users.js";
import { authMiddleware, devAuthMiddleware } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' })); // Increased limit for bulk operations

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Choose authentication strategy based on environment
const useDatabase = process.env.NODE_ENV === "production" || process.env.USE_DATABASE === "true";

if (useDatabase) {
  console.log("🔒 Using database authentication");
  app.use("/api", authMiddleware);
  app.use("/api", databaseRoutes);
} else {
  console.log("🔓 Using development authentication");
  app.use("/api", devAuthMiddleware);
  app.use("/api", devRoutes);
}

// Advanced features (always available)
app.use("/api/advanced", advancedRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

// Serve static files from dist/public (built frontend)
app.use(express.static(path.join(__dirname, "../dist/public")));

// Serve all other routes to index.html (SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

const PORT = process.env.PORT || 3001;

// Initialize database if using database mode
if (useDatabase) {
  console.log("🗄️ Initializing database connection...");
  try {
    // Test database connection
    import("./db.js").then(({ db }) => {
      console.log("✅ Database connection established");
    }).catch(error => {
      console.error("❌ Database connection failed:", error);
      console.log("🔄 Falling back to development mode");
      // Could implement fallback logic here
    });
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

app.listen(PORT, () => {
  console.log(`[express] serving on port ${PORT}`);
  console.log(`[mode] ${useDatabase ? 'production (database)' : 'development (file storage)'}`);
});
