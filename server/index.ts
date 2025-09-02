import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { devRoutes } from "./routes/dev";
import { apiRoutes } from "./routes/api";
import { reportsRouter } from "./routes/reports";
import { dashboardRouter } from "./routes/dashboard";
import { calendarRouter } from "./routes/calendar";
import { scheduledTasksService } from "./services/scheduledTasksService";
import { emailService } from "./services/emailService";
import { pdfService } from "./services/pdfService";

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

// API routes based on environment
if (process.env.NODE_ENV === "development") {
  // Use mock dev routes in development
  app.use("/api", devRoutes);
} else {
  // Use real API routes in production
  app.use("/api", apiRoutes);
  app.use("/api/reports", reportsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/calendar", calendarRouter);
}

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
  
  // Initialize services
  try {
    // Verify email service
    const emailReady = await emailService.verifyConnection();
    if (emailReady) {
      console.log("[email] Email service initialized");
    } else {
      console.warn("[email] Email service not configured properly");
    }
    
    // Start scheduled tasks
    scheduledTasksService.start();
    console.log("[scheduler] Scheduled tasks started");
  } catch (error) {
    console.error("[startup] Error initializing services:", error);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[shutdown] SIGTERM received, shutting down gracefully");
  
  // Stop scheduled tasks
  scheduledTasksService.stop();
  
  // Close PDF service
  await pdfService.close();
  
  // Close server
  server.close(() => {
    console.log("[shutdown] Server closed");
    process.exit(0);
  });
});
